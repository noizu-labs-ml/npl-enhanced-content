# Schema — `sem-table`

Contract per conventions.md v0.4. BDD source of truth for
`test/e2e/sem-table.cy.js`. Changes here precede spec changes precede code.

## Scope semantics

A data table a reader can sort and filter, whose **authored `<table>` is
the contract**. There is no JSON payload (PRD §5 planned one; it is
dropped): the markup a person reads is the data a machine reads, which is
the only way the extraction invariant can hold over a surface the reader
reorders. The element exists because sort and filter are interactions,
and because a machine reader needs the authored row order back after the
DOM has been reordered — plain `<table kind="…">` covers a table nobody
sorts.

## Authoring form

Class form (v0.4):

```html
<div class="sem-table" id="t-tokens" data-kind="comparison" data-controls="sort,filter" data-sticky>
  <table>
    <caption>Token lifetimes</caption>
    <thead><tr><th scope="col">Token</th><th scope="col">Lifetime</th><th scope="col">Rotates</th></tr></thead>
    <tbody>
      <tr><td>access</td><td data-value="900">15 min</td><td>no</td></tr>
      <tr><td>refresh</td><td data-value="2592000">30 days</td><td>yes</td></tr>
    </tbody>
  </table>
</div>
```

Element form: `<sem-table controls sticky>` around the same `<table>`.
Parameters are read as `data-<name>` first, then bare `<name>`.

- Child: **exactly one `<table>`** with a `<thead>` whose header row uses
  `<th scope="col">`, one `<tbody>`, and optionally a `<caption>`. A table
  without a `<thead>` gets no sort control. Anything else inside the table
  (`<tfoot>`, `colgroup`) is left alone.
- `data-value` (optional, on `<td>`): the sort key for that cell when the
  visible text is not the key (`15 min` vs `900`). Two numeric keys compare
  numerically; anything else compares as text, locale-aware.
- `data-controls` (optional): comma flags from `sort`, `filter`; default
  `sort`. Unknown flags are ignored.
- `data-sticky` / `sticky` (boolean, optional): the header row sticks to
  the top of the scroll container. CSS only — works with scripts off.
- `id`, `kind`, `tags`, `audience` per the global catalog. `kind="comparison"`
  — on the `sem-table` or on a plain `<table>` — additionally sticks the
  first column on horizontal scroll (CSS only).

## Rendered form

### Fallback (reading bundle, `dist/semtext-reading.js`)

- Every `<tbody>` row is stamped `data-sem-source-index` (0-based document
  order across every `<tbody>`) **once, at enhancement**, and never
  rewritten. This is the
  authored order; sorting moves rows, the stamp does not move with the
  meaning. The Lit tier stamps identically, and a row already stamped is
  left alone.
- `.sem-table-chrome` is inserted as the element's first child, before the
  table: the filter input when enabled (`input[type="search"]
  .sem-table-filter[aria-label="Filter rows"]`) and always a
  `.sem-table-status` live region.
- **sort** — each header cell's content is wrapped in
  `button.sem-table-sort[type="button"]`; the `<th>` carries
  `aria-sort="none"`. Activating a header sorts the body rows by that
  column: first `ascending`, again `descending`, a third time **`none`**,
  which restores the authored order. The active header carries
  `aria-sort`; every other header returns to `none`. Ties fall back to
  `data-sem-source-index`, so authored order survives any earlier sort on
  another column. Rows move only **within their own `<tbody>`** — a sort
  reorders, it never re-parents — and are re-appended so the DOM order is
  the visible order. Only the first `<thead>` row is sortable. The status
  region reads `Sorted by <column>, <direction>`.
- **filter** — typing in the filter sets `hidden` on every body row whose
  text does not contain the query (case-insensitive) and clears it on the
  rest, at once. The status region reads `<n> of <m> rows` (clearing the
  query: `<m> rows`), updated ~200 ms after typing settles. Filter and
  sort compose in one sentence: `2 of 4 rows, sorted by Lifetime,
  ascending`.
- The element carries `data-sem-fallback` once wired.

### Upgraded (Lit `SemTable`)

- Thin wrapper: claims `data-sem-upgraded`, clears `data-sem-fallback`,
  and once its `<table>` exists calls the same enhance function the
  bundle uses. Idempotent on the chrome's presence.

### JS-off

- A plain table. `data-sticky` still sticks the header and `kind="comparison"`
  still sticks the first column, because both are CSS. No chrome, no
  buttons, nothing hidden.

## Events

None.

## A11y contract

- Sortable headers are real `<button type="button">` elements inside the
  `<th scope="col">`, so the column header semantics survive and the
  control is keyboard-operable. `aria-sort` on the `<th>` is the sort
  state — exactly one header is ever not `none`.
- `.sem-table-status` is `role="status"` (implicit polite live region;
  no explicit `aria-live`, and the filter announcement is debounced so a
  screen reader is not read every keystroke). Sort and filter results are
  announced without moving focus.
- The filter is a labelled `<input type="search">`.
- Filtered-out rows carry the native `hidden` attribute, so they leave the
  accessibility tree with the visual.
- The `<caption>` is authored, never generated, and stays first in the
  table.
- In print, filtered-out rows are shown again (`tr[hidden]` →
  `table-row`) so the paper copy is the whole table.

## Machine contract

- `fields: { caption, columns: string[], rows: string[][] }`; `text` = the
  caption (`""` when absent).
  - `columns`: the **first** header row's cell texts, in authored order,
    read from `:scope > thead > tr:first-of-type`. The sort button is read
    *through* — it is a wrapper, not chrome. A table nested inside a cell
    is that cell's content, never a second set of columns or rows.
  - `rows`: one array per `<tbody>` row, cell texts normalised, **in
    authored order**: rows are sorted by `data-sem-source-index` when the
    stamp is present and taken in DOM order otherwise. Both orders are the
    same order; the stamp is what makes that true after a sort.
  - A `hidden` row (filtered out) is a row. Extraction never consults
    visibility (spec/extraction.md §5b).
- **Recorded exception (spec/extraction.md §5).** This is the one element
  whose runtime *reorders* authored nodes. The invariant
  `E(D) = E(I(R(D)))` holds because extraction restores authored order
  from the stamp; the stamp itself is a runtime attribute and is not
  reported.
- The inner `<table>` mints no plain record of its own even when it
  carries `kind` — the wrapper is the record. A `<table kind>` outside a
  `sem-table` still mints as before.
- Chrome classes: `sem-table-chrome`, `sem-table-status`, `sem-table-filter`.
  `aria-sort`, `data-sem-source-index` and `hidden` are session state.
- The annotated-text renderer emits `columns` joined with ` | ` and each
  row on its own indented line.
