/**
 * reading/table — sem-table: sort and filter over an authored <table>.
 *
 * Spec: spec/schema/sem-table.md. Idempotent on the chrome's presence. The
 * one runtime here that REORDERS authored nodes: every body row is stamped
 * `data-sem-source-index` once, before anything moves, and extraction
 * (src/extract/records.ts) restores authored order from that stamp — the
 * recorded exception in spec/extraction.md §5. Filtering uses the native
 * `hidden` attribute, which extraction never consults.
 */

import { param } from '../shared/attr.js';

export const TABLE = ':is(sem-table, .sem-table)';

type Dir = 'ascending' | 'descending';

function key(cell: HTMLTableCellElement | undefined): string {
  if (!cell) return '';
  const v = cell.getAttribute('data-value');
  return (v !== null ? v : cell.textContent || '').trim();
}

function compare(a: string, b: string): number {
  const x = parseFloat(a);
  const y = parseFloat(b);
  if (a !== '' && b !== '' && isFinite(x) && isFinite(y) && !isNaN(+a) && !isNaN(+b)) return x - y;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function enhanceTableElement(el: Element): void {
  if (el.querySelector(':scope > .sem-table-chrome')) return;
  const table = el.querySelector<HTMLTableElement>(':scope > table');
  if (!table) return;
  const controls = (param(el, 'controls') ?? 'sort').split(/[,\s]+/).filter(Boolean);
  const rows = (): HTMLTableRowElement[] =>
    Array.from(table.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr'));
  rows().forEach((r, i) => {
    if (!r.hasAttribute('data-sem-source-index')) r.setAttribute('data-sem-source-index', String(i));
  });

  const chrome = document.createElement('div');
  chrome.className = 'sem-table-chrome';
  const status = document.createElement('span');
  status.className = 'sem-table-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  if (controls.indexOf('filter') >= 0) {
    const input = document.createElement('input');
    input.type = 'search';
    input.className = 'sem-table-filter';
    input.setAttribute('aria-label', 'Filter rows');
    input.placeholder = 'Filter rows';
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      const all = rows();
      let shown = 0;
      all.forEach((r) => {
        const hit = !q || (r.textContent || '').toLowerCase().indexOf(q) >= 0;
        r.toggleAttribute('hidden', !hit);
        if (hit) shown++;
      });
      status.textContent = q ? shown + ' of ' + all.length + ' rows' : all.length + ' rows';
    });
    chrome.appendChild(input);
  }
  chrome.appendChild(status);
  el.insertBefore(chrome, table);

  if (controls.indexOf('sort') < 0) return;
  const heads = Array.from(table.querySelectorAll<HTMLTableCellElement>(':scope > thead th'));
  heads.forEach((th, col) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sem-table-sort';
    while (th.firstChild) b.appendChild(th.firstChild);
    th.appendChild(b);
    th.setAttribute('aria-sort', 'none');
    b.addEventListener('click', () => {
      const dir: Dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
      heads.forEach((h) => h.setAttribute('aria-sort', h === th ? dir : 'none'));
      const sign = dir === 'ascending' ? 1 : -1;
      const sorted = rows()
        .map((r, i) => ({ r, i, k: key(r.cells[col]) }))
        .sort((p, q) => sign * compare(p.k, q.k) || p.i - q.i)
        .map((x) => x.r);
      const body = sorted[0]?.parentElement;
      if (body) sorted.forEach((r) => body.appendChild(r));
      status.textContent = 'Sorted by ' + (b.textContent || '').trim() + ', ' + dir;
    });
  });
}
