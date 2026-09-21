/**
 * reading/source — sem-source: flip a section between its rendered form
 * and the literal authored markup.
 *
 * Spec: spec/schema/sem-source.md. The markup comes from the snapshot the
 * fallback CORE takes before any handler runs (`src/fallback/source.ts`,
 * a `script.sem-source-raw[type="text/plain"]` child); this module only
 * builds the chrome and, on first request, a fence holding one class-form
 * `sem-code` enhanced by the same `enhanceCodeElement` as any listing.
 * Idempotent on the chrome's presence, so bundle scan and Lit wrapper may
 * both run. Mode is `data-view-as` on the element (presentation, never
 * extracted); nothing is persisted.
 */

import { param } from '../shared/attr.js';
import { enhanceCodeElement } from './code.js';

export const SOURCE = ':is(sem-source, .sem-source)';

/** Snapshot text → fence text: unescape, drop parse-time tier markers, dedent, trim. */
function clean(raw: string): string {
  const lines = raw
    .replace(/<\\\/script/gi, '</script')
    .replace(/ data-sem-(?:upgraded|fallback)=""/g, '')
    .split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  let indent = Infinity;
  lines.forEach((l) => {
    if (l.trim()) indent = Math.min(indent, l.match(/^[ \t]*/)![0].length);
  });
  return lines.map((l) => l.slice(indent < Infinity ? indent : 0)).join('\n');
}

export function enhanceSourceElement(el: Element): void {
  if (el.querySelector(':scope > .sem-source-chrome')) return;
  const snap = el.querySelector(':scope > script.sem-source-raw');
  // No core snapshot (reading bundle alone): best effort, chrome and all.
  const raw = snap ? snap.textContent || '' : el.innerHTML;

  const chrome = document.createElement('div');
  chrome.className = 'sem-source-chrome';
  chrome.setAttribute('role', 'group');
  chrome.setAttribute('aria-label', 'View as');
  const label = param(el, 'label');
  if (label) {
    const s = document.createElement('span');
    s.className = 'sem-source-label';
    s.textContent = label;
    chrome.appendChild(s);
  }
  const button = (act: string, text: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-act', act);
    b.textContent = text;
    chrome.appendChild(b);
    return b;
  };
  const html = button('html', 'Rendered');
  const src = button('source', 'Source');
  el.insertBefore(chrome, el.firstChild);

  let fence: HTMLElement | null = null;
  const build = (): void => {
    if (fence) return;
    fence = document.createElement('div');
    fence.className = 'sem-source-fence';
    const code = document.createElement('div');
    code.className = 'sem-code';
    code.setAttribute('data-lang', 'html');
    code.setAttribute('data-controls', 'copy,wrap');
    const pre = document.createElement('pre');
    const c = document.createElement('code');
    c.textContent = clean(raw); // text, never markup
    pre.appendChild(c);
    code.appendChild(pre);
    fence.appendChild(code);
    el.appendChild(fence);
    enhanceCodeElement(code);
    code.setAttribute('data-sem-fallback', '');
  };
  const mode = (m: string): void => {
    if (m == 'source') build();
    el.setAttribute('data-view-as', m);
    html.setAttribute('aria-pressed', String(m != 'source'));
    src.setAttribute('aria-pressed', String(m == 'source'));
  };
  mode(param(el, 'view-as') == 'source' ? 'source' : 'html');
  chrome.addEventListener('click', (e) => {
    const act = (e.target as Element).closest('button')?.getAttribute('data-act');
    if (act) mode(act);
  });
}
