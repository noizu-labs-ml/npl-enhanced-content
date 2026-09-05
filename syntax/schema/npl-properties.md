# Schema — `npl-properties` / `npl-property`

Contract per conventions.md v0.4. BDD source of truth for
`cypress/e2e/npl-properties.cy.js`. Changes here precede spec changes
precede code.

## Authoring form (v0.4 class-based)

```html
<div class="npl-properties" data-kind="config">
  <div class="npl-property" data-key="token ttl">15m</div>
  <div class="npl-property" data-key="refresh rotation">per use</div>
  <div class="npl-property" data-key="storage">httpOnly cookie</div>
</div>
```

- `data-key`: required, free text (the term). Property text = the value.
- Compact sugar (conventions §3): `<div class="npl-property">token ttl
  :: 15m</div>` is legal; **`data-key` wins** when both present.
  v0.4 fallback does NOT parse `::` — sugar authors must use `data-key`
  for correct rendering until a parser ships.
- `data-kind` free token (`config`, `spec`, `env` …); `id`, `tags` global.
- ❓ Q2 resolved for v1: pure definition list, **no copy/search chrome**;
  revisit only if a consumer demands it.

## Rendered form (v0.4)

- **Zero-JS element.** Pure CSS: two-column grid — key column renders
  `attr(data-key)` (muted, small-caps), value is the element text.
  Semantically a `<dl>` equivalent: each property authored as
  `role="definition"` + `aria-label="data-key"` — the label carries the
  term, the content the value.
- Alternating row surface tint; keys wrap, values keep whitespace.

## Events

None.

## A11y contract

- Each property authored as `role="definition"` with `aria-label` =
  `data-key` — AT announces the pair without JS.
- `data-key` doubles as the machine-facing term.

## Machine contract

- Container = a closed set of key/value assertions; each property is one
  assertion (`data-key` = subject qualifier, text = value).
- Duplicate `data-key` values in one container = authoring error;
  fallback logs a console warning (non-fatal).
