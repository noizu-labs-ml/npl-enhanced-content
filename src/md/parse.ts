/**
 * md/parse — a small Markdown → DOM renderer for `sem-md`.
 *
 * Spec: spec/schema/sem-md.md ("Markdown dialect"). Hand-written rather
 * than vendored so the Markdown bundle stays inside its 8 KB budget; the
 * subset is the GFM a reading document uses — tables first, then headings,
 * paragraphs, lists, block quotes, rules, fenced code, and the inline set.
 *
 * SAFETY. Output is built with createElement / textContent only. There is
 * no innerHTML anywhere in this file, so raw HTML inside the Markdown is
 * rendered as the characters that were typed. Link and image URLs with a
 * `javascript:`, `data:` or `vbscript:` scheme are dropped (the text still
 * renders); every anchor carries rel="noopener".
 */

const UNSAFE = /^\s*(javascript|data|vbscript):/i;

function el(tag: string, parent: Node, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  parent.appendChild(e);
  return e;
}

function txt(parent: Node, s: string): void {
  if (s) parent.appendChild(document.createTextNode(s));
}

/* ------------------------------------------------------------------ *
 * Inline
 * ------------------------------------------------------------------ */

const LINK = /^!?\[((?:[^[\]]|\[[^\]]*\])*)\]\(\s*(?:<([^>]*)>|([^\s)]*))(?:\s+"([^"]*)")?\s*\)/;
const PUNCT = /[!-/:-@[-`{-~]/;

export function inline(s: string, out: Node): void {
  let i = 0;
  let buf = '';
  const flush = (): void => { txt(out, buf); buf = ''; };
  while (i < s.length) {
    const c = s[i];
    if (c === '\n') {
      const br = /(?: {2,}|\\)$/.exec(buf);
      if (br) { buf = buf.slice(0, br.index); flush(); el('br', out); i++; continue; }
    }
    if (c === '\\' && i + 1 < s.length && PUNCT.test(s[i + 1])) { buf += s[i + 1]; i += 2; continue; }
    if (c === '`') {
      const run = (/^`+/.exec(s.slice(i)) as RegExpExecArray)[0];
      const end = s.indexOf(run, i + run.length);
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
      if (c !== '~' || dbl) {
        const d = dbl ? c + c : c;
        const start = i + d.length;
        const end = s.indexOf(d, start);
        if (end > start && !/\s/.test(s[start]) && !/\s/.test(s[end - 1])) {
          flush();
          inline(s.slice(start, end), el(dbl ? (c === '~' ? 'del' : 'strong') : 'em', out));
          i = end + d.length;
          continue;
        }
      }
    }
    if (c === '[' || (c === '!' && s[i + 1] === '[')) {
      const m = LINK.exec(s.slice(i));
      if (m) {
        flush();
        const url = m[2] !== undefined ? m[2] : m[3];
        const safe = !UNSAFE.test(url);
        if (c === '!') {
          if (safe) {
            const img = el('img', out);
            img.setAttribute('src', url);
            img.setAttribute('alt', m[1]);
            if (m[4]) img.setAttribute('title', m[4]);
          } else txt(out, m[1]);
        } else if (safe) {
          const a = el('a', out);
          a.setAttribute('href', url);
          a.setAttribute('rel', 'noopener');
          if (m[4]) a.setAttribute('title', m[4]);
          inline(m[1], a);
        } else inline(m[1], out);
        i += m[0].length;
        continue;
      }
    }
    buf += c;
    i++;
  }
  flush();
}

/* ------------------------------------------------------------------ *
 * Blocks
 * ------------------------------------------------------------------ */

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)/;
const HEAD = /^ {0,3}(#{1,6})\s+(.*?)\s*(?:\s#+)?$/;
const HR = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const QUOTE = /^ {0,3}> ?/;
const LIST = /^( {0,3})([-*+]|\d{1,9}[.)])( +|$)(.*)$/;
const DELIM = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

const blank = (l: string): boolean => !l.trim();
const lead = (l: string): number => (/^ */.exec(l) as RegExpExecArray)[0].length;

function cells(l: string): string[] {
  const t = l.replace(/\\\|/g, '\u0000').trim();
  const parts = t.split('|');
  if (t[0] === '|') parts.shift();
  if (parts.length && t[t.length - 1] === '|') parts.pop();
  return parts.map((p) => p.trim().replace(/\u0000/g, '|'));
}

function tableAt(lines: string[], i: number): boolean {
  return lines[i].indexOf('|') > -1 && i + 1 < lines.length && DELIM.test(lines[i + 1]);
}

function startsBlock(l: string): boolean {
  return FENCE.test(l) || HEAD.test(l) || HR.test(l) || QUOTE.test(l) || LIST.test(l);
}

export function parseBlocks(src: string, out: Node): void {
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
      if (m[2]) code.className = 'language-' + m[2];
      continue;
    }

    if ((m = HEAD.exec(line))) { inline(m[2], el('h' + m[1].length, out)); i++; continue; }
    if (HR.test(line)) { el('hr', out); i++; continue; }

    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < n && QUOTE.test(lines[i])) { body.push(lines[i].replace(QUOTE, '')); i++; }
      parseBlocks(body.join('\n'), el('blockquote', out));
      continue;
    }

    if ((m = LIST.exec(line))) {
      const ordered = /\d/.test(m[2]);
      const depth = m[1].length;
      const list = el(ordered ? 'ol' : 'ul', out);
      if (ordered && m[2].slice(0, -1) !== '1') list.setAttribute('start', m[2].slice(0, -1));
      let tight = true;
      const items: string[][] = [];
      while (i < n) {
        const im = LIST.exec(lines[i]);
        if (!im || /\d/.test(im[2]) !== ordered || im[1].length !== depth) break;
        const indent = depth + im[2].length + (im[3].length || 1);
        const body = [im[4]];
        i++;
        while (i < n) {
          const l = lines[i];
          if (blank(l)) {
            // a blank followed by an indented continuation stays inside the item
            if (i + 1 < n && !blank(lines[i + 1]) && lead(lines[i + 1]) >= indent) { body.push(''); i++; continue; }
            break;
          }
          if (lead(l) >= indent) { body.push(l.slice(indent)); i++; continue; }
          break;
        }
        items.push(body);
        while (i < n && blank(lines[i])) { i++; if (i < n && LIST.test(lines[i])) tight = false; }
      }
      for (const body of items) {
        const li = el('li', list);
        parseBlocks(body.join('\n'), li);
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
          inline(h, th);
        });
        const tbody = el('tbody', table);
        i += 2;
        while (i < n && !blank(lines[i]) && lines[i].indexOf('|') > -1) {
          const row = el('tr', tbody);
          const cs = cells(lines[i]);
          head.forEach((_, k) => {
            const td = el('td', row);
            if (aligns[k]) td.style.textAlign = aligns[k];
            inline(cs[k] || '', td);
          });
          i++;
        }
        continue;
      }
    }

    const para = [line];
    i++;
    while (i < n && !blank(lines[i]) && !startsBlock(lines[i]) && !tableAt(lines, i)) { para.push(lines[i]); i++; }
    inline(para.join('\n').trim(), el('p', out));
  }
}

/** Render normalised Markdown into a fresh container. */
export function render(src: string, tag = 'div'): HTMLElement {
  const box = document.createElement(tag);
  parseBlocks(src, box);
  return box;
}
