# SemText Data Visualizer — Design

**Status: DRAFT v0.1 — phase 1 built on this branch.**
Normative for `sem-data-visualizer` / `sem-data-source`. Companion to
`spec/conventions.md` (vocabulary rules) and `spec/schema/sem-table.md` (the
authored-table cousin). Everything marked **phase N** is design-only until its
phase ships; **phase 1** is implemented and tested
(`test/unit/data-visualizer.test.ts`).

---

## 0. Naming decisions (recorded per brief)

- **Elements:** `<sem-data-visualizer>` is the container; `<sem-data-source>`
  is each source. `sem-` prefix, per conventions §0. The class-form alias
  (Appendix A shape) is accepted by every selector as
  `:is(sem-data-visualizer, .sem-data-visualizer)` / source ditto.
- **Attributes kept exactly as briefed:** `data-type`, `data-name`,
  `data-format`, `source`, `data-views`, `data-view`. These are the `data-*`
  spellings; the vocabulary's alias rule (conventions §2) means every tier
  also accepts the bare spelling (`type=`, `name=`, `format=`, `views=`,
  `view=`) via the shared `param()` reader — `data-*` wins when both are
  present. `source` is the one bare-by-brief name (the URL of a file/API
  source; phase 4) and reads `data-source` as its alias twin.
- **Class namespace:** this element family owns `.sem-data-*` only —
  `.sem-data-body`, `.sem-data-error`, `.sem-data-schema`, `.sem-data-sort` —
  never another element's classes (conventions §2). Runtime state uses
  `data-*`: `data-sem-source-index` row stamps, `data-nullable` header marker,
  tier markers (`data-sem-fallback` / `data-sem-upgraded`).

## 1. Requirements coverage (the full arc)

| # | Requirement | Phases |
| :-- | :-- | --: |
| R1 | Data sources: API links; data-file links (CSV, YAML, JSON; hosted or relative); inline CSV, YAML, SQL, Markdown table | 1 (inline table) · 2 (inline csv/yaml/json/sql) · 4 (files/API) |
| R2 | Structure definition: simple row/column declaration for simple data; OpenAPI-style YAML schema payload for nested data | 3 |
| R3 | Default query/view the user can edit or alter in the page | 1 (parse + default selection) · 5 (in-page editing) |
| R4 | Viewer: click opens a modal full-page visualizer; `#deep-links` reload a specified view | 6 |

## 2. Elements

### `sem-data-visualizer` — container (phase 1)

Wraps one or more `sem-data-source` children. Mints no records of its own; it
is the unit of tier scanning, of the future modal viewer (R4), and of shared
view state (R3/5). Zero-JS: shows its source children unenhanced (like
`sem-md`, the authored text reads as pre-wrapped text).

```html
<sem-data-visualizer id="dv-tokens">
  <sem-data-source data-name="Token lifetimes" data-format="table"
                   data-views="core=token,max-uses; all=*" data-view="all">
    | Token | Max uses | Lifetime | Rotates | Since      |
    | :---- | -------: | :------- | :------ | :--------- |
    | access | 200     | 15 min   | true    | 2026-01-05 |
    | id     | 1000    | 1 hour   | false   | 2026-02-14 |
  </sem-data-source>
</sem-data-visualizer>
```

### `sem-data-source` — one dataset (phase 1)

| Attribute | Values | Meaning |
| :-- | :-- | :-- |
| `data-name` | free text | Human label; renders as the table `caption` (phase 1). Also the source key for `data-views` sources that reference each other (phase 5). |
| `data-format` | `table` (default) · `csv` · `yaml` · `json` · `sql` (phases 2/4) | Payload syntax of the body (or of the `source` target). Unknown/unbuilt format ⇒ clear inline error, never a silent blank. |
| `data-type` | absent · `rows` · `yaml-schema` (phase 3) | **Structure declaration.** Absent ⇒ the tier infers (§4). `rows` ⇒ simple row/column definition; `yaml-schema` ⇒ OpenAPI-style payload. Phase 1 warns and infers anyway. |
| `source` | URL | Where the data lives for file/API sources (phase 4). Inline payload and `source` are mutually exclusive; both present is an authoring error. |
| `data-views` | `name=colspec; name=colspec` | Named views; `colspec` is `*` or a comma list of column names, matched case-insensitively. Malformed segments are skipped (a typo hides a view, it never breaks the document). |
| `data-view` | view name | The default view. Resolution: `data-view` name ⇒ first declared view ⇒ implicit `all=*`. An unknown `data-view` name resolves by those fallbacks. |

## 3. Views (R3, phase 1 slice)

Phase 1 honors `data-views`/`data-view` **as parsing plus a default**: the
named view selects which columns render visible; every column stays in the
DOM (`hidden` attribute on excluded `th`/`td`), so extraction and a later view
switch never lose data. View switching UI and user-authored edits are phase 5.
Views are declared on the source; a view of another source is phase 5
(`data-name` as the reference key).

## 4. Schema inference (phase 1; `src/data/table.ts`, pure)

Given the parsed table, each column gets `{ name, type, nullable }`:

- **null cells:** an empty cell (after trim) is null. A column whose every
  body cell is empty — or a table with no body rows — infers `type: "null"`,
  `nullable: true`.
- **per-cell narrowest type:** `integer` (`/^[+-]?\d+$/`) → `boolean` (literal
  `true`/`false` only; `yes`/`no` stay string) → `date` (ISO-8601 shaped
  `YYYY-MM-DD[THH:MM[:SS]][Z|±HH:MM]` that `Date.parse` accepts) → `number`
  (finite numeric) → `string`.
- **column type:** all non-null cells agree ⇒ that type; `integer`+`number`
  mix ⇒ `number`; any other mix ⇒ `string`.
- **nullable:** at least one empty cell in the column.
- **names:** header text, trimmed; an empty header synthesizes `col-<n>`
  (1-based).
- **exposure:** the enhance appends
  `<script type="application/json" class="sem-data-schema">` to the source
  with `{ name, format, view, views, columns: ColumnSchema[] }` — JSON in a
  script child, so no attribute quoting/escaping mangles it. The pure
  functions (`parseGfmTable`, `inferSchema`, `parseViews`, `resolveView`,
  `visibleColumns`) are exported from the bundle for programmatic use.

**Table parsing rules** (GFM, mirroring `src/md/parse.ts`): first non-blank
line must carry `|`; a delimiter row must follow and match the header width;
body rows continue until a blank or pipe-less line. Ragged rows follow the
Markdown renderer: missing cells are empty (inferred null), extras dropped.
The body's common indentation is stripped (`dedent`) — tables are authored
inside element markup. A non-table body is a **clear error**, rendered inline
(`.sem-data-error`, `role="alert"`) and warned on the author channel; the
tier never guesses. Cell splitting keeps pipes inside code spans literal.

## 5. Rendering tiers (phase 1)

- **Zero-JS:** authored text (sem-md precedent). The vocabulary CSS gives the
  elements block boxes; nothing is hidden.
- **Vanilla fallback tier** (`src/reading/data.ts` in
  `dist/semtext-reading.js`): parses each direct source child, renders a
  **native `<table>`** — real `thead`/`tbody`, `th[scope="col"]`, `caption`
  from `data-name` — plus the schema JSON child, and wires **per-column
  sort**: header text wrapped in `button.sem-data-sort`, `aria-sort`
  `none → ascending → descending → none` cycle, rows stamped
  `data-sem-source-index` and sorted within their own `<tbody>` (a sort
  reorders, never re-parents; stamp = tiebreak so authored order survives —
  the same extraction-safe contract as `sem-table`). Comparison is typed by
  the inferred schema (numbers numerically, dates by epoch, booleans
  `false < true`); null cells sort last regardless of direction.
- **Lit tier** (`src/lit/sem-data-visualizer.ts`): thin wrapper, lifecycle
  only — waits for source children (`whenChildrenReady`), runs the same
  idempotent enhance, claims `data-sem-upgraded`. Sorting is NOT Lit-only: it
  lives in the shared enhance so both tiers behave identically (the sem-table
  pattern; the brief's "small Lit enhancement" is satisfied by the wrapper
  carrying the enhancement in the Lit bundle).
- **Extraction invariant:** rendered chrome (`.sem-data-body` is generated
  content) is skipped by extraction; cell text is authored order after an
  un-sort; `hidden` columns are presentation state. Phase 1 records no
  exception — nothing reorders authored *content*, only rendered rows.

## 6. Loader design (R1 files/API — phase 4 design)

- **`source` URL resolution:** absolute URL, or relative to the document
  base. Format precedence: explicit `data-format` > extension (`.csv`,
  `.yaml`/`.yml`, `.json`, `.md`) > sniff (first non-blank char/line).
- **Fetch contract:** `fetch(source)` with `credentials: "same-origin"`;
  responses parsed by format (§7). Errors (network, status ≥ 400, parse)
  render the same `.sem-data-error` channel with the status/parse cause —
  never a blank pane. A source may declare `data-cache="no"` to skip the
  in-memory cache (one fetch per URL per page load by default).
- **CORS/portability:** a remote `source` needs CORS for the browser tier;
  the portable single-file form (conventions §7 hard rule: *no runtime fetch
  in portable docs*) requires authors to inline the payload instead — the
  loader refuses to fetch when the document is `file://`, with an error that
  says so.
- **API sources** (phase 4): `source` + `data-format="json"` covers JSON
  APIs; `data-path` (dot/bracket path into the response, e.g.
  `data.items`) flattens a nested payload into rows via the phase-3 structure
  machinery.
- **Sequencing:** loaders are async; the enhance renders a placeholder
  `.sem-data-pending` region, then swaps in the table (or error). The
  fallback core stays synchronous — loaders land as their own module so the
  ≤19.5 KB reading budget is not taxed by documents that never fetch.

## 7. Payload formats (phase 2+)

| Format | Parse | Rows |
| :-- | :-- | :-- |
| `table` (phase 1) | GFM table (§4) | header + body rows |
| `csv` | RFC 4180: quoted fields, embedded commas/newlines/CRLF | first row = header (or `data-header="false"` ⇒ synthesized `col-n`) |
| `json` | array of objects (column union, stable order: first-seen) or object of arrays | keys = columns |
| `yaml` | flat sequences of mappings (phase 2); nested mappings go through the phase-3 schema | keys = columns |
| `sql` | a single `SELECT` statement rendered as a table of its (unexecuted) result shape — columns from the projection, zero rows until phase 4 wires a query engine | projection = columns |

## 8. Structure declaration (R2 — phase 3 design)

- `data-type="rows"` — simple tabular definition on the source:
  `data-columns="name:string, port:integer, ready:boolean?"` (`?` suffix =
  nullable, `:type` optional). Declared types **override** inference per
  column; inference still fills any column the declaration omits.
- `data-type="yaml-schema"` — the body (or `source`) is a YAML payload in an
  OpenAPI-style subset: top-level `schema:` (`type: object|array`, `properties`
  with `type`/`format`/`items`/`required`/`nullable`) plus `data:` (the
  rows). Nested `properties` flatten to dotted column paths
  (`address.city`); arrays of scalars serialize as JSON cells. The same
  schema drives the typed sort keys and validates cells (mismatch = warning
  channel entry, never a dropped row).

## 9. In-page views and queries (R3 — phase 5 design)

Per visualizer, a view chrome lists declared views; the reader switches
freely (state in `data-view`, hash param `dv-<id>.view=<name>` — the
`&`-joined hash segments of `src/shared/state.ts`). Editing: column
show/hide, sort, and a free-form filter persist as a *derived view* scoped to
the session unless the author marks `data-editable="session"` — authored
markup is never rewritten, and extraction stays invariant (edits are
presentation state).

## 10. Modal viewer and deep links (R4 — phase 6 design)

Clicking a visualizer's expand control opens a full-page modal rendering the
active view large (same enhance output, `role="dialog"`, `aria-modal`, focus
trap, `Esc` closes). Deep links: `#<visualizer-id>/<view-name>` (the
`container/child` hash form of `src/shared/state.ts`) reloads the document
with that view active and, when the link was minted from the modal, the modal
open. Links are authorable: the chrome exposes a copy-link button.

## 11. Phase plan

| Phase | Scope | Status |
| --: | :-- | :-- |
| **1** | Container + inline Markdown-table source; schema inference + JSON exposure; native-table render; per-column typed sort; `data-views`/`data-view` parsing + default selection; clear errors. Unit-tested. | **BUILT (this branch)** |
| 2 | Inline `csv`, `json`, `yaml` payloads (§7); `sql` result-shape tables. | designed |
| 3 | Structure declarations: `data-type="rows"` and OpenAPI-style YAML payloads (§8); declared-over-inferred types; nested flattening. | designed |
| 4 | `source` loaders: files (hosted/relative) and JSON APIs (§6); async render contract; error channels. | designed |
| 5 | View chrome: switching, per-session edits, derived views (§9). | designed |
| 6 | Modal full-page viewer + `#`-deep-links (§10). | designed |

## 12. Open questions

| # | Question | Lean |
| :-- | :-- | :-- |
| DV-Q1 | Should `yes`/`no` (and `on`/`off`) read boolean? | No — literal `true`/`false` only; locale prose stays prose. Revisit with a real corpus. |
| DV-Q2 | Should views live on the container (shared across sources) instead of per source? | Per source for now; phase 5 adds container-level composed views. |
| DV-Q3 | Schema JSON: script child (current) vs `data-sem-schema` attribute mirror for no-DOM consumers? | Script child; add the attribute mirror only if a consumer asks. |
