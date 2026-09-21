/**
 * reading/table — sem-table: sort and filter over an authored <table>.
 *
 * Spec: spec/schema/sem-table.md. Idempotent on the chrome's presence. The
 * one runtime here that REORDERS authored nodes: every body row is stamped
 * `data-sem-source-index` once, before anything moves, and extraction
 * (src/extract/records.ts) restores authored order from that stamp — the
 * recorded exception in spec/extraction.md §5. Rows move only within their
 * own <tbody> (a sort reorders, it never re-parents), ties fall back to
 * the stamp so authored order survives any earlier sort, and the third
 * activation of a header returns to `aria-sort="none"` and the authored
 * order. Filtering uses the native `hidden` attribute, which extraction
 * never consults.
 */

import { param } from '../shared/attr.js';

export const TABLE = ':is(sem-table, .sem-table)';
const STAMP = 'data-sem-source-index';

function key(cell: HTMLTableCellElement | undefined): string {
  if (!cell) return '';
  const v = cell.getAttribute('data-value');
  return (v !== null ? v : cell.textContent || '').trim();
}

function compare(a: string, b: string): number {
  const x = +a;
  const y = +b;
  if (a !== '' && b !== '' && isFinite(x) && isFinite(y)) return x - y;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// A row inserted after enhancement has no stamp; treat it as 0 so NaN never reaches the comparator.
const stamp = (r: Element): number => +(r.getAttribute(STAMP) || 0);

export function enhanceTableElement(el: Element): void {
  if (el.querySelector(':scope > .sem-table-chrome')) return;
  const table = el.querySelector<HTMLTableElement>(':scope > table');
  if (!table) return;
  const controls = (param(el, 'controls') ?? 'sort').split(/[,\s]+/);
  const rows = (): HTMLTableRowElement[] =>
    Array.from(table.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr'));
  rows().forEach((r, i) => {
    if (!r.hasAttribute(STAMP)) r.setAttribute(STAMP, String(i));
  });

  const chrome = document.createElement('div');
  chrome.className = 'sem-table-chrome';
  const status = document.createElement('span');
  status.className = 'sem-table-status';
  status.setAttribute('role', 'status');
  // One region, two facts: "2 of 4 rows, sorted by Lifetime, ascending".
  let filterMsg = '';
  let sortMsg = '';
  let timer = 0;
  const announce = (delay = 0): void => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const t = [filterMsg, sortMsg].filter(Boolean).join(', ');
      status.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    }, delay);
  };

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
      filterMsg = q ? shown + ' of ' + all.length + ' rows' : all.length + ' rows';
      announce(200); // rows hide at once; the announcement waits for typing to settle
    });
    chrome.appendChild(input);
  }
  chrome.appendChild(status);
  el.insertBefore(chrome, table);

  if (controls.indexOf('sort') < 0) return;
  // Same header cells extraction reads: th or td in the first thead row.
  const heads = Array.from(table.querySelectorAll<HTMLTableCellElement>(':scope > thead > tr:first-of-type > :is(th, td)'));
  heads.forEach((th, col) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sem-table-sort';
    while (th.firstChild) b.appendChild(th.firstChild);
    th.appendChild(b);
    th.setAttribute('aria-sort', 'none');
    b.addEventListener('click', () => {
      const was = th.getAttribute('aria-sort');
      const dir = was === 'ascending' ? 'descending' : was === 'descending' ? 'none' : 'ascending';
      heads.forEach((h) => h.setAttribute('aria-sort', h === th ? dir : 'none'));
      const sign = dir === 'descending' ? -1 : 1;
      const cmp = (p: HTMLTableRowElement, q: HTMLTableRowElement): number =>
        (dir === 'none' ? 0 : sign * compare(key(p.cells[col]), key(q.cells[col]))) || stamp(p) - stamp(q);
      // Sort within each <tbody>; a sort reorders rows, it never re-parents them.
      const bodies = new Map<HTMLElement, HTMLTableRowElement[]>();
      rows().forEach((r) => {
        const b = r.parentElement as HTMLElement;
        (bodies.get(b) || bodies.set(b, []).get(b)!).push(r);
      });
      bodies.forEach((list, body) => list.sort(cmp).forEach((r) => body.appendChild(r)));
      sortMsg = dir === 'none' ? '' : 'sorted by ' + (b.textContent || '').trim() + ', ' + dir;
      announce();
    });
  });
}
