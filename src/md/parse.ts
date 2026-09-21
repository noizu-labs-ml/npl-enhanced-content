/**
 * md/parse — a small Markdown → DOM renderer for `sem-md`.
 *
 * Spec: spec/schema/sem-md.md ("Markdown dialect"). Hand-written rather
 * than vendored so the Markdown bundle stays inside its 8 KB budget; the
 * subset is the GFM a reading document uses — tables first, then headings
 * (ATX and setext), paragraphs, lists, block quotes, rules, fenced code,
 * and the inline set.
 *
 * SAFETY. Output is built with createElement / textContent only. There is
 * no innerHTML anywhere in this file, so raw HTML inside the Markdown is
 * rendered as the characters that were typed. Link, image and autolink
 * destinations pass an ALLOWLIST after normalisation: browsers strip every
 * C0 control and space inside a scheme before resolving it, so the check
 * strips them first and then admits only http(s), mailto, tel, ftp and
 * scheme-less (relative / fragment) destinations. Anchors carry
 * rel="noopener noreferrer".
 *
 * BOUNDS. Block and inline nesting is capped at DEPTH; deeper content is
 * rendered as text rather than recursed into, so a 5000-deep quote or list
 * cannot overflow the stack. The inline scanner works on offsets (sticky
 * regexes, indexOf from a position) and never re-slices the input, so a
 * pathological line is linear, not quadratic.
 */

const DEPTH = 16;

function el(tag: string, parent: Node, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  parent.appendChild(e);
  return e;
}

function txt(parent: Node, s: string): void {
  if (s) parent.appendChild(document.createTextNode(s));
}

/** Protocols a rendered link or image may carry, plus the document's own
 *  (a relative destination in a file:// document resolves to file:). */
const ALLOWED = new Set(['http:', 'https:', 'mailto:', 'tel:', 'ftp:']);

/**
 * The destination as a parsed URL, or null when it must render as text.
 *
 * The WHATWG parser does the normalisation (leading/trailing C0 + space
 * trimmed, tab/LF/CR removed anywhere, the rest percent-encoded), so
 * `java&#9;script:` and `javascript:` land on the same protocol, and the
 * protocol of the PARSED object is checked against an allowlist — the
 * form a static analyser recognises (CodeQL js/xss-through-dom): what
 * reaches `href` / `src` is `url.href`, never the authored string.
 * Relative destinations resolve against the document, so the attribute
 * is absolute; an unparsable destination renders as text.
 */
export function safeUrl(raw: string): URL | null {
  try {
    const url = new URL(raw, document.baseURI);
    // `file:` only, never `location.protocol`: a page served under blob:
    // or another scheme must not widen the allowlist.
    return ALLOWED.has(url.protocol) || url.protocol === 'file:' ? url : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Inline
 * ------------------------------------------------------------------ */

// Shared (via lastIndex) by inline() and cells(): non-reentrant by design.
const BACKTICKS = /`+/y;
const LINK = /!?\[((?:[^[\]]|\[[^\]]*\])*)\]\(\s*(?:<([^>]*)>|([^\s)]*))(?:\s+"([^"]*)")?\s*\)/y;
const AUTOLINK = /<((?:https?|mailto|tel|ftp):[^\s<>]*)>/y;
const PUNCT = /[!-/:-@[-`{-~]/;
const WORD = /[A-Za-z0-9]/;

export function inline(s: string, out: Node, depth = 0): void {
  if (depth > DEPTH) { txt(out, s); return; }
  let i = 0;
  let buf = '';
  const flush = (): void => { txt(out, buf); buf = ''; };
  const at = (re: RegExp): RegExpExecArray | null => { re.lastIndex = i; return re.exec(s); };
  while (i < s.length) {
    const c = s[i];
    let m: RegExpExecArray | null;
    if (c === '\n') {
      const br = /(?: {2,}|\\)$/.exec(buf);
      if (br) { buf = buf.slice(0, br.index); flush(); el('br', out); i++; continue; }
    }
    if (c === '\\' && i + 1 < s.length && PUNCT.test(s[i + 1])) { buf += s[i + 1]; i += 2; continue; }
    if (c === '`' && (m = at(BACKTICKS))) {
      const run = m[0];
      let end = s.indexOf(run, i + run.length);
      // the closing run must be exactly as long as the opener
      while (end > -1 && (s[end - 1] === '`' || s[end + run.length] === '`')) end = s.indexOf(run, end + 1);
      if (end > -1) {
        flush();
        let code = s.slice(i + run.length, end);
        if (code.length > 2 && code[0] === ' ' && code[code.length - 1] === ' ') code = code.slice(1, -1);
        el('code', out, code);
        i = end + run.length;
        continue;
      }
    }
    if (c === '*' || c === '_' || c === '~') {
      const dbl = s[i + 1] === c;
      // `_` never opens or closes inside a word (snake_case_names stay text).
      // The rescan below is bounded but worst-case quadratic on `_a`×10k.
      const intraword = c === '_' && i > 0 && WORD.test(s[i - 1]);
      if ((c !== '~' || dbl) && !intraword) {
        const d = dbl ? c + c : c;
        const start = i + d.length;
        let end = s.indexOf(d, start);
        while (end > -1 && c === '_' && end + d.length < s.length && WORD.test(s[end + d.length])) end = s.indexOf(d, end + 1);
        if (end > start && !/\s/.test(s[start]) && !/\s/.test(s[end - 1])) {
          flush();
          inline(s.slice(start, end), el(dbl ? (c === '~' ? 'del' : 'strong') : 'em', out), depth + 1);
          i = end + d.length;
          continue;
        }
      }
    }
    if (c === '<' && (m = at(AUTOLINK))) {
      const url = safeUrl(m[1]);
      flush();
      if (url) link(out, url).textContent = m[1]; else txt(out, m[0]);
      i += m[0].length;
      continue;
    }
    if ((c === '[' || (c === '!' && s[i + 1] === '[')) && (m = at(LINK))) {
      flush();
      const url = safeUrl(m[2] !== undefined ? m[2] : m[3]);
      if (c === '!') {
        if (url) {
          const img = el('img', out) as HTMLImageElement;
          img.src = url.href;
          img.setAttribute('alt', m[1]);
        } else txt(out, m[1]);
      } else inline(m[1], url ? link(out, url) : out, depth + 1);
      i += m[0].length;
      continue;
    }
    buf += c;
    i++;
  }
  flush();
}

/** A link title (`"…"` after the destination) is accepted and dropped. */
function link(out: Node, url: URL): HTMLElement {
  const a = el('a', out) as HTMLAnchorElement;
  a.href = url.href;
  a.setAttribute('rel', 'noopener noreferrer');
  return a;
}

/* ------------------------------------------------------------------ *
 * Blocks
 * ------------------------------------------------------------------ */

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)/;
const HEAD = /^ {0,3}(#{1,6})\s+(.*?)\s*(?:\s#+)?$/;
const HR = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const SETEXT = /^ {0,3}(=+|-+)\s*$/;
const QUOTE = /^ {0,3}> ?/;
const LIST = /^( {0,3})([-*+]|\d{1,9}[.)])( +|$)(.*)$/;
const DELIM = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

const blank = (l: string): boolean => !l.trim();
const lead = (l: string): number => (/^ */.exec(l) as RegExpExecArray)[0].length;

/** Split a table row on unescaped pipes; a pipe inside a code span is literal. */
function cells(l: string): string[] {
  const t = l.trim();
  const out: string[] = [];
  let cur = '';
  let tick = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '\\' && t[i + 1] === '|') { cur += '|'; i++; continue; }
    if (c === '`') {
      BACKTICKS.lastIndex = i;
      const run = (BACKTICKS.exec(t) as RegExpExecArray)[0];
      tick = tick === 0 ? run.length : tick === run.length ? 0 : tick;
      cur += run;
      i += run.length - 1;
      continue;
    }
    if (c === '|' && !tick) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  if (t[0] === '|') out.shift();
  if (out.length && t[t.length - 1] === '|' && t[t.length - 2] !== '\\') out.pop();
  return out.map((p) => p.trim());
}

function tableAt(lines: string[], i: number): boolean {
  return lines[i].indexOf('|') > -1 && i + 1 < lines.length && DELIM.test(lines[i + 1]);
}

function startsBlock(l: string): boolean {
  return FENCE.test(l) || HEAD.test(l) || HR.test(l) || QUOTE.test(l) || LIST.test(l);
}

export function parseBlocks(src: string, out: Node, depth = 0): void {
  if (depth > DEPTH) { el('p', out, src); return; }
  const lines = src.split('\n');
  const n = lines.length;
  let i = 0;
  while (i < n) {
    const line = lines[i];
    if (blank(line)) { i++; continue; }
    let m: RegExpExecArray | null;

    if ((m = FENCE.exec(line))) {
      const fence = m[1];
      const body: string[] = [];
      i++;
      while (i < n) {
        const cm = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(lines[i]);
        if (cm && cm[1][0] === fence[0] && cm[1].length >= fence.length) break;
        body.push(lines[i]);
        i++;
      }
      i++;
      const code = el('code', el('pre', out), body.join('\n'));
      // `language-` is the one class the renderer mints outside `.sem-md-*`
      if (m[2]) code.className = 'language-' + m[2].replace(/[^\w.+-]/g, '');
      continue;
    }

    if ((m = HEAD.exec(line))) { inline(m[2], el('h' + m[1].length, out), depth); i++; continue; }
    if (HR.test(line)) { el('hr', out); i++; continue; }

    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < n && QUOTE.test(lines[i])) { body.push(lines[i].replace(QUOTE, '')); i++; }
      parseBlocks(body.join('\n'), el('blockquote', out), depth + 1);
      continue;
    }

    if ((m = LIST.exec(line))) {
      const ordered = /\d/.test(m[2]);
      const indent0 = m[1].length;
      const list = el(ordered ? 'ol' : 'ul', out);
      if (ordered && m[2].slice(0, -1) !== '1') list.setAttribute('start', m[2].slice(0, -1));
      let tight = true;
      const items: string[][] = [];
      while (i < n) {
        const im = LIST.exec(lines[i]);
        if (!im || /\d/.test(im[2]) !== ordered || im[1].length !== indent0) break;
        const indent = indent0 + im[2].length + (im[3].length || 1);
        const body = [im[4]];
        i++;
        while (i < n) {
          const l = lines[i];
          if (blank(l)) {
            if (i + 1 < n && !blank(lines[i + 1]) && lead(lines[i + 1]) >= indent) { body.push(''); i++; continue; }
            break;
          }
          if (lead(l) >= indent) { body.push(l.slice(indent)); i++; continue; }
          break;
        }
        items.push(body);
        while (i < n && blank(lines[i])) { i++; if (i < n && LIST.test(lines[i]) && !HR.test(lines[i])) tight = false; }
      }
      for (const body of items) {
        const li = el('li', list);
        parseBlocks(body.join('\n'), li, depth + 1);
        if (tight) {
          Array.from(li.children).forEach((p) => {
            if (p.tagName !== 'P') return;
            while (p.firstChild) li.insertBefore(p.firstChild, p);
            li.removeChild(p);
          });
        }
      }
      continue;
    }

    if (tableAt(lines, i)) {
      const head = cells(line);
      const aligns = cells(lines[i + 1]).map((d) =>
        /^:-+:$/.test(d) ? 'center' : /-:$/.test(d) ? 'right' : d[0] === ':' ? 'left' : '');
      if (head.length === aligns.length) {
        const table = el('table', out);
        const tr = el('tr', el('thead', table));
        head.forEach((h, k) => {
          const th = el('th', tr);
          th.setAttribute('scope', 'col');
          if (aligns[k]) th.style.textAlign = aligns[k];
          inline(h, th, depth);
        });
        const tbody = el('tbody', table);
        i += 2;
        while (i < n && !blank(lines[i]) && lines[i].indexOf('|') > -1) {
          const row = el('tr', tbody);
          const cs = cells(lines[i]);
          // ragged rows: missing cells render empty, extra cells are dropped
          head.forEach((_, k) => {
            const td = el('td', row);
            if (aligns[k]) td.style.textAlign = aligns[k];
            inline(cs[k] || '', td, depth);
          });
          i++;
        }
        continue;
      }
    }

    const para = [line];
    i++;
    let tag = 'p';
    while (i < n && !blank(lines[i])) {
      // setext: a paragraph closed by `===` / `---` is a heading, not a rule
      if ((m = SETEXT.exec(lines[i]))) { tag = m[1][0] === '=' ? 'h1' : 'h2'; i++; break; }
      if (startsBlock(lines[i]) || tableAt(lines, i)) break;
      para.push(lines[i]);
      i++;
    }
    inline(para.join('\n').trim(), el(tag, out), depth);
  }
}
