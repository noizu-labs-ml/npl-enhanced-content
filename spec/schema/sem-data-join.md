# Schema — `sem-data-join`

Contract per conventions.md v0.6. BDD source of truth for
`test/e2e/sem-data-visualizer.cy.js`. Changes here precede spec changes
precede code.

## Scope semantics

A declaration, not a rendered dataset: it materializes one extra bucket
— the **inner join** of two named buckets on a single named key column —
that queries can address by `name`. Placed directly inside a
`sem-data-visualizer`; zero-JS it is invisible (there is nothing to
read). Outer joins, multiple keys and non-equality joins are out of
scope.

## Authoring form

```html
<sem-data-join name="user-orders" left="Users" right="Orders" on="user-id">
</sem-data-join>
```

Class-form alias (conventions Appendix A): `.sem-data-join`. Parameters
are read as `data-<name>` first, then bare `<name>`; `data-*` wins when
both are present.

- `data-name` (alias `name`): required — bucket key of the join result;
  colliding with a source name is an authoring error.
- `data-left` (alias `left`): required — the left-hand bucket to join,
  by `data-name` reference.
- `data-right` (alias `right`): required — the other bucket to join, by
  `data-name` reference.
- `data-on` (alias `on`): required — the named key column; must exist
  (case-insensitive) in both buckets.
- `id`, `kind`, `tags` per the global attribute catalog.

## Rendered form

### Enhanced (reading handler, `src/reading/data.ts`)

- Semantics: inner join. Each left row matched by ≥1 right row yields a
  result row of the left row's columns plus the right row's columns
  minus the key; a right column whose name already exists in the left
  bucket is exposed as `<right-bucket-ref>.<column>`. Unmatched left
  rows drop. Key equality: both sides numeric (finite number-coercible)
  compare canonicalized (`String(Number(v))`), else trimmed strings.
- Bucket references resolve exact, then case-insensitive, then
  normalized (lowercase, non-alphanumeric runs collapsed to `-`, edge
  `-` trimmed).
- Joins heal when a late file/API bucket arrives (a single re-run event,
  no re-entry loop).
- A join whose buckets or key do not resolve renders `.sem-data-error`
  (`role="alert"`) on the join element and registers no bucket.

### JS-off

- Invisible: a declaration with nothing to read.

## Events

None.

## Machine contract

- The join element mints no record of its own; its result is a bucket,
  addressable by `SELECT … FROM <name>` and by queries/joins, and
  renders only through a `sem-data-query`'s results table.
