/**
 * md/element — sem-md: chrome, rendered body, raw fence, toggle and copy.
 *
 * Spec: spec/schema/sem-md.md. Idempotent per element: chrome already
 * present means nothing is built again, which lets the Lit wrapper call
 * this after the bundle may already have run (or vice versa). The tier
 * marker is NOT set here — the bundle's document scan stamps
 * `data-sem-fallback`, the Lit wrapper stamps `data-sem-upgraded`.
 *
 * The element's text is consumed: after enhancement it holds exactly the
 * chrome, the rendered `.sem-md-body` and the `.sem-md-raw` fence whose
 * `<code>` carries the normalised source byte-identically. Extraction reads
 * `source` from that fence (spec/extraction.md §4), so the raw view is
 * the record, not a copy of it.
 *
 * The clipboard helper is shared with sem-code (src/shared/clipboard.ts);
 * the fence's own copy / wrap chrome is sem-code's, supplied by the caller
 * (see `enhanceFence`) so this bundle does not carry the listing code.
 */

import { param } from '../shared/attr.js';
import { normalizeMd } from '../shared/mdsource.js';
import { parseBlocks } from './parse.js';
import { copyText, canCopy } from '../shared/clipboard.js';

export const MD = ':is(sem-md, .sem-md)';

/**
 * `enhanceFence` gives the raw fence its sem-code chrome (copy, wrap). The
 * Lit wrapper passes the imported `enhanceCodeElement`; the Markdown bundle
 * passes the reading bundle's global when that script is on the page and
 * nothing otherwise, so the parser is never bundled twice and a document
 * without the reading bundle still gets a plain (CSS-captioned) fence.
 */
export function enhanceMdElement(el: Element, enhanceFence?: (fence: Element) => void): void {
  if (el.querySelector(':scope > .sem-md-chrome')) return;
  const source = normalizeMd(el.textContent || '');
  const controls = (param(el, 'controls') ?? 'toggle,copy').split(/[,\s]+/).filter(Boolean);
  const label = param(el, 'label') || '';
  let raw = param(el, 'view-as') === 'raw';
  el.textContent = '';

  const div = (cls: string): HTMLDivElement => {
    const d = document.createElement('div');
    d.className = cls;
    return d;
  };
  const chrome = div('sem-md-chrome');
  if (label) {
    const s = document.createElement('span');
    s.className = 'sem-md-label';
    s.textContent = label;
    chrome.appendChild(s);
  }
  const status = document.createElement('span');
  status.className = 'sem-md-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  const button = (act: string, text: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-act', act);
    b.textContent = text;
    chrome.appendChild(b);
    return b;
  };
  let toggle: HTMLButtonElement | null = null;
  const copyOk = canCopy();
  controls.forEach((c) => {
    if (c === 'toggle' && !toggle) toggle = button('toggle', 'Markdown');
    if (c === 'copy' && copyOk) button('copy', 'Copy').setAttribute('aria-label', 'Copy Markdown');
  });
  chrome.appendChild(status);

  const body = div('sem-md-body');
  parseBlocks(source, body);

  const rawBox = div('sem-md-raw');
  const fence = div('sem-code');
  fence.setAttribute('data-lang', 'markdown');
  fence.setAttribute('data-controls', 'copy,wrap');
  const code = document.createElement('code');
  code.textContent = source;
  fence.appendChild(document.createElement('pre')).appendChild(code);
  rawBox.appendChild(fence);
  if (enhanceFence) enhanceFence(fence);

  el.append(chrome, body, rawBox);

  const setView = (r: boolean): void => {
    raw = r;
    el.setAttribute('data-view-as', r ? 'raw' : 'rendered');
    el.removeAttribute('view-as');
    if (toggle) toggle.setAttribute('aria-pressed', String(r));
  };
  setView(raw);

  chrome.addEventListener('click', (e) => {
    const act = (e.target as Element).closest('button')?.getAttribute('data-act');
    if (act === 'toggle') setView(!raw);
    if (act === 'copy') copyText(source, status);
  });
}
