/**
 * reading/data — sem-data-visualizer / sem-data-source, phase 1.
 *
 * Spec: spec/data-visualizer.md. The container wraps one or more data
 * sources; each source's text body is an inline payload. Phase 1 supports the
 * inline Markdown table (`data-format="table"`, the default): the enhance
 * parses it (src/data/table.ts), renders a NATIVE <table> — real thead/tbody,
 * th[scope=col], no framework rendering — exposes the inferred schema as
 * application/json, applies the data-views/data-view column selection, and
 * wires per-column sort (aria-sort cycle, rows stamped data-sem-source-index
 * and sorted within their own tbody, extraction-safe exactly like sem-table).
 *
 * Tiering matches sem-table: this per-element enhance is idempotent on DOM
 * state; the reading bundle scans for containers the Lit tier has not already
 * claimed, and src/lit/sem-data-visualizer.ts calls the same function.
 *
 * Zero-JS: with no script at all the authored source text shows as text (the
 * sem-md precedent); the fallback tier here is what renders the native table.
 * Later phases (CSV/YAML/JSON/SQL payloads, declared structures, file and API
 * loaders, editable views, modal + deep links) are designed in the spec and
 * deliberately absent here.
 */

import { param } from '../shared/attr.js';
import { warn } from '../shared/audience.js';
import {
  inferSchema,
  parseGfmTable,
  parseViews,
  resolveView,
  visibleColumns,
  type ColumnSchema,
  type ColumnType,
} from '../data/table.js';

export const DATA_VISUALIZER = ':is(sem-data-visualizer, .sem-data-visualizer)';
export const DATA_SOURCE = ':is(sem-data-source, .sem-data-source)';
const STAMP = 'data-sem-source-index';

/**
 * Enhance one container: render every direct source child that has not been
 * rendered yet. Idempotent on the presence of a rendered body/error.
 */
export function enhanceDataVisualizerElement(el: Element): void {
  if (el.querySelector(':scope > ' + DATA_SOURCE + ' > :is(.sem-data-body, .sem-data-error)')) return;
  el.querySelectorAll(':scope > ' + DATA_SOURCE).forEach((src) => renderSource(src));
}

function renderSource(src: Element): void {
  const format = (param(src, 'format') ?? 'table').trim().toLowerCase();
  if (format !== 'table') {
    renderError(src, 'data-format="' + format + '" is not built yet — phases 2-4 add csv, yaml, json and sql (spec/data-visualizer.md)');
    return;
  }
  if (param(src, 'type') !== null) {
    warn('sem-data-source[@data-type]: declared structures land in phase 3; inferring the schema from the table (spec/data-visualizer.md)');
  }

  const parsed = parseGfmTable(src.textContent || '');
  if (!parsed.ok) {
    renderError(src, parsed.error);
    return;
  }
  const schema = inferSchema(parsed.table);
  const views = parseViews(param(src, 'views'));
  const view = resolveView(views, param(src, 'view'));
  const shown = visibleColumns(view, parsed.table.columns);
  const name = (param(src, 'name') ?? '').trim();

  const body = document.createElement('div');
  body.className = 'sem-data-body';
  body.appendChild(buildTable(parsed.table, schema, shown, name));
  src.appendChild(body);

  // Schema exposure: machine-readable JSON, standard script child so no
  // attribute quoting/escaping mangles it.
  const json = document.createElement('script');
  json.type = 'application/json';
  json.className = 'sem-data-schema';
  json.textContent = JSON.stringify({
    name: name || null,
    format,
    view: view.name,
    views: views.map((v) => v.name),
    columns: schema,
  });
  src.appendChild(json);

  wireSort(body.querySelector('table') as HTMLTableElement, schema);
  src.setAttribute('data-sem-fallback', '');
}

function buildTable(
  table: { columns: string[]; rows: string[][] },
  schema: ColumnSchema[],
  shown: boolean[],
  name: string,
): HTMLTableElement {
  const el = document.createElement('table');
  if (name) {
    const caption = document.createElement('caption');
    caption.textContent = name;
    el.appendChild(caption);
  }
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  table.columns.forEach((col, k) => {
    const th = document.createElement('th');
    th.setAttribute('scope', 'col');
    th.textContent = col;
    // Views hide columns with native `hidden` — the data stays in the DOM,
    // so extraction and a later view switch never lose it.
    if (!shown[k]) th.setAttribute('hidden', '');
    if (schema[k].nullable) th.setAttribute('data-nullable', '');
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  el.appendChild(thead);

  const tbody = document.createElement('tbody');
  table.rows.forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((cell, k) => {
      const td = document.createElement('td');
      td.textContent = cell;
      if (!shown[k]) td.setAttribute('hidden', '');
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  el.appendChild(tbody);
  return el;
}

/* Sort — the sem-table contract, typed by the inferred schema. */

function sortKey(type: ColumnType, text: string): number | boolean | string | null {
  if (text === '') return null;
  switch (type) {
    case 'integer':
    case 'number':
      return +text;
    case 'boolean':
      return text === 'true';
    case 'date':
      return Date.parse(text);
    default:
      return text;
  }
}

function compareValues(a: ReturnType<typeof sortKey>, b: ReturnType<typeof sortKey>): number {
  // Nulls sort last regardless of direction (handled by the caller's sign).
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return +a - +b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

function wireSort(table: HTMLTableElement, schema: ColumnSchema[]): void {
  if (!table) return;
  const rows = (): HTMLTableRowElement[] =>
    Array.from(table.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr'));
  rows().forEach((r, i) => {
    if (!r.hasAttribute(STAMP)) r.setAttribute(STAMP, String(i));
  });
  // A row inserted after enhancement has no stamp; treat it as 0.
  const stamp = (r: Element): number => +(r.getAttribute(STAMP) || 0);

  const heads = Array.from(
    table.querySelectorAll<HTMLTableCellElement>(':scope > thead > tr:first-of-type > th'),
  );
  heads.forEach((th, col) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sem-data-sort';
    while (th.firstChild) b.appendChild(th.firstChild);
    th.appendChild(b);
    th.setAttribute('aria-sort', 'none');
    b.addEventListener('click', () => {
      const was = th.getAttribute('aria-sort');
      const dir = was === 'ascending' ? 'descending' : was === 'descending' ? 'none' : 'ascending';
      heads.forEach((h) => h.setAttribute('aria-sort', h === th ? dir : 'none'));
      const type = schema[col]?.type ?? 'string';
      const sign = dir === 'descending' ? -1 : 1;
      const cmp = (p: HTMLTableRowElement, q: HTMLTableRowElement): number =>
        (dir === 'none'
          ? 0
          : sign * compareValues(sortKey(type, (p.cells[col]?.textContent || '').trim()),
            sortKey(type, (q.cells[col]?.textContent || '').trim()))) ||
        stamp(p) - stamp(q);
      // Sort within each <tbody>; a sort reorders rows, it never re-parents
      // them, and the stamp keeps authored order as the tiebreak.
      const bodies = new Map<HTMLElement, HTMLTableRowElement[]>();
      rows().forEach((r) => {
        const body = r.parentElement as HTMLElement;
        (bodies.get(body) || bodies.set(body, []).get(body)!).push(r);
      });
      bodies.forEach((list, body) => list.sort(cmp).forEach((r) => body.appendChild(r)));
    });
  });
}

function renderError(src: Element, message: string): void {
  const p = document.createElement('p');
  p.className = 'sem-data-error';
  p.setAttribute('role', 'alert');
  p.textContent = 'sem-data-source: ' + message;
  src.appendChild(p);
  src.setAttribute('data-sem-fallback', '');
  warn('sem-data-source: ' + message);
}
