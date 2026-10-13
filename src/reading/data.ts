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
 * Phase 6 (the modal viewer + deep links) lives in src/reading/data-modal.ts
 * and hangs off the enhance below; see spec/data-visualizer.md §10.
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
  type TableData,
} from '../data/table.js';
import { parseCsv } from '../data/csv.js';
import { parseYamlSubset, yamlToTable } from '../data/yaml.js';
import { extractPath, jsonToTable } from '../data/json.js';
import { parseSelectShape } from '../data/sql.js';
import { applyColumnDecl, flattenYamlSchema, parseColumnDecl } from '../data/structure.js';
import { formatFromUrl, resolveSource, sniffFormat } from '../data/load.js';
import { normalizeRef } from '../data/names.js';
import { fetchSource } from './data-load.js';
import { buildTable, wireSort, STAMP } from './data-tableview.js';
import { registerBucket, wireQueryChrome, wireViewButtons } from './data-query.js';
import {
  applyDeepLinkToContainer,
  applyDeepLinkToSource,
  modalOpenFor,
  wireDataTools,
} from './data-modal.js';

export const DATA_VISUALIZER = ':is(sem-data-visualizer, .sem-data-visualizer)';
export const DATA_SOURCE = ':is(sem-data-source, .sem-data-source)';

const FORMATS = new Set(['table', 'csv', 'yaml', 'json', 'sql']);
const STRUCTURES = new Set(['rows', 'yaml-schema']);

/** A successful parse may carry a declared schema (phase 3) and warnings. */
type ParseResult =
  | { ok: true; table: TableData; schema?: ColumnSchema[]; warnings?: string[] }
  | { ok: false; error: string };

/**
 * Enhance one container: render every direct source child that has not been
 * rendered yet. Idempotent on the presence of a rendered body/error.
 */
export function enhanceDataVisualizerElement(el: Element): void {
  if (modalOpenFor(el)) return; // children are teleported into the modal viewer
  if (!el.querySelector(':scope > ' + DATA_SOURCE + ' > :is(.sem-data-body, .sem-data-error, .sem-data-pending)')) {
    el.querySelectorAll(':scope > ' + DATA_SOURCE).forEach((src) => renderSource(src));
  }
  // Joins + the default query chrome wire on every pass (both idempotent).
  wireQueryChrome(el);
  // Phase 6 (§10): the Expand/Copy-link chrome, then any deep-link state in
  // the current hash (view/bucket/dv/q/modal) applies to what was just built.
  wireDataTools(el);
  applyDeepLinkToContainer(el);
}

/** The declared structure, if any: data-type / type, lowercased. */
export function declaredType(src: Element): string {
  return (param(src, 'type') ?? '').trim().toLowerCase();
}

/** The `source` attribute in either spelling (phase 4 file/API loads). */
export function sourceHref(src: Element): string | null {
  return param(src, 'source') ?? src.getAttribute('source');
}

/**
 * Parse one source's payload (element attrs + text ⇒ TableData). Pure aside
 * from reading the element; used by the render path and by sql `*`
 * resolution, which must see sibling columns regardless of document order.
 * `load` carries a fetched body (phase 4) with its resolved format.
 */
export function parsePayload(src: Element, load?: { text: string; format: string }): ParseResult {
  const format = (load?.format ?? param(src, 'format') ?? 'table').trim().toLowerCase();
  if (!FORMATS.has(format)) {
    return { ok: false, error: 'unknown data-format "' + format + '" — supported: table, csv, yaml, json, sql' };
  }
  if (!load && sourceHref(src) !== null) {
    return { ok: false, error: 'file and API sources (source="…") land in phase 4 — inline the payload for now' };
  }
  const structure = declaredType(src);
  if (structure && !STRUCTURES.has(structure)) {
    return { ok: false, error: 'unknown data-type "' + structure + '" — supported: rows, yaml-schema' };
  }
  if (structure === 'yaml-schema' && format !== 'yaml') {
    return { ok: false, error: 'data-type="yaml-schema" needs a yaml payload (data-format="yaml")' };
  }
  const text = load ? load.text : src.textContent || '';
  switch (format) {
    case 'table': {
      const r = parseGfmTable(text);
      return r.ok ? { ok: true, table: r.table } : r;
    }
    case 'csv': {
      const r = parseCsv(text, (param(src, 'header') ?? 'true').trim().toLowerCase() !== 'false');
      return r.ok ? { ok: true, table: r.table } : r;
    }
    case 'yaml': {
      const parsed = parseYamlSubset(text);
      if (!parsed.ok) return parsed;
      if (structure === 'yaml-schema') return flattenYamlSchema(parsed.value);
      const r = yamlToTable(parsed.value);
      return r.ok ? { ok: true, table: r.table } : r;
    }
    case 'json': {
      let value: unknown;
      try {
        value = JSON.parse(text);
      } catch (e) {
        return { ok: false, error: 'invalid json: ' + (e as Error).message };
      }
      const r = jsonToTable(extractPath(value, param(src, 'path')));
      return r.ok ? { ok: true, table: r.table } : r;
    }
    default: {
      const shape = parseSelectShape(text);
      if (!shape.ok) return shape;
      if (shape.shape.projection === '*') {
        const cols = resolveStarColumns(src, shape.shape.from);
        if (!cols) {
          return { ok: false, error: 'SELECT * cannot determine columns: no bucket named "' + shape.shape.from + '" in this visualizer (a sql declaration is a shape, not a result)' };
        }
        return { ok: true, table: { columns: cols, rows: [] } };
      }
      return { ok: true, table: { columns: shape.shape.projection, rows: [] } };
    }
  }
}

/** A sql `SELECT *` declaration mirrors the FROM bucket's columns. */
function resolveStarColumns(src: Element, ref: string): string[] | null {
  const container = src.parentElement;
  if (!container) return null;
  const want = normalizeRef(ref);
  for (const sib of Array.from(container.querySelectorAll(':scope > ' + DATA_SOURCE))) {
    if (sib === src) continue;
    const name = (param(sib, 'name') ?? '').trim();
    if (!name || normalizeRef(name) !== want) continue;
    const parsed = parsePayload(sib);
    if (parsed.ok) return parsed.table.columns;
  }
  return null;
}

export { normalizeRef };

function renderSource(src: Element): void {
  const format = (param(src, 'format') ?? 'table').trim().toLowerCase();
  const structure = declaredType(src);
  const href = sourceHref(src);
  const inline = (src.textContent || '').trim() !== '';

  if (href !== null && inline) {
    renderError(src, 'an inline payload and source="' + href + '" are mutually exclusive — keep one');
    return;
  }
  if (href !== null) {
    loadSource(src);
    return;
  }

  const parsed = parsePayload(src);
  if (!parsed.ok) {
    renderError(src, parsed.error);
    return;
  }
  finishSource(src, parsed, format, structure);
}

/** Shared tail of both render paths: declarations, table, schema json. */
function finishSource(src: Element, parsed: { ok: true; table: TableData; schema?: ColumnSchema[]; warnings?: string[] }, format: string, structure: string): void {
  (parsed.warnings ?? []).forEach((w) => warn('sem-data-source: ' + w));

  let schema = parsed.schema ?? inferSchema(parsed.table);
  if (structure === 'rows') {
    const decl = parseColumnDecl(param(src, 'columns'));
    decl.warnings.forEach((w) => warn('sem-data-source: ' + w));
    const applied = applyColumnDecl(parsed.table, decl.cols, schema);
    schema = applied.schema;
    applied.warnings.forEach((w) => warn('sem-data-source: ' + w));
  }
  const name = (param(src, 'name') ?? '').trim();
  if (name) registerBucket(src, name, parsed.table); // joins + queries see this bucket
  renderTable(src, parsed.table, schema, format, structure);
}

/**
 * Phase 4 file/API loads: policy check (§9), pending placeholder, fetch,
 * format resolution (explicit > extension > sniff), parse + render. The
 * sync path above stays unchanged for inline sources.
 */
function loadSource(src: Element): void {
  const href = sourceHref(src) ?? '';
  const policy = resolveSource(href, document.baseURI || location.href);
  if (policy.kind === 'refused') {
    renderError(src, policy.reason);
    return;
  }
  const pending = document.createElement('div');
  pending.className = 'sem-data-pending';
  pending.setAttribute('role', 'status');
  pending.textContent = 'Loading ' + href + '…';
  src.appendChild(pending);

  const explicit = param(src, 'format');
  const structure = declaredType(src);
  const noCache = (param(src, 'cache') ?? '').trim().toLowerCase() === 'no';
  fetchSource(policy.url, noCache).then((text) => {
    const format = (explicit ?? '').trim().toLowerCase() || formatFromUrl(policy.url) || sniffFormat(text);
    const parsed = parsePayload(src, { text, format });
    pending.remove();
    if (!parsed.ok) {
      renderError(src, parsed.error);
      return;
    }
    finishSource(src, parsed, format, structure);
  }).catch((err: unknown) => {
    pending.remove();
    const message = err instanceof Error ? err.message : String(err);
    const cors = policy.crossOrigin
      ? ' — a cross-origin request needs CORS: the server at ' + policy.url + ' must allow this origin'
      : '';
    renderError(src, 'failed to load "' + href + '": ' + message + cors);
  });
}

function renderTable(src: Element, table: TableData, schema: ColumnSchema[], format: string, structure: string): void {
  const views = parseViews(param(src, 'views'));
  const view = resolveView(views, param(src, 'view'));
  const shown = visibleColumns(view, table.columns);
  const name = (param(src, 'name') ?? '').trim();

  const body = document.createElement('div');
  body.className = 'sem-data-body';
  body.appendChild(buildTable(table, schema, shown, name));
  src.appendChild(body);

  // Schema exposure: machine-readable JSON, standard script child so no
  // attribute quoting/escaping mangles it.
  const json = document.createElement('script');
  json.type = 'application/json';
  json.className = 'sem-data-schema';
  json.textContent = JSON.stringify({
    name: name || null,
    format,
    type: structure || null,
    view: view.name,
    views: views.map((v) => v.name),
    columns: schema,
  });
  src.appendChild(json);

  const tableEl = body.querySelector('table') as HTMLTableElement;
  wireSort(tableEl, schema);
  wireViewButtons(src, tableEl, table.columns);
  // A bucket-scoped deep link (§10) whose source landed late applies here.
  applyDeepLinkToSource(src);
  src.setAttribute('data-sem-fallback', '');
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
