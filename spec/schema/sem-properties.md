# Schema — `sem-properties` / `sem-property`

Contract per conventions.md v0.4. BDD source of truth for
`test/e2e/sem-properties.cy.js`. Changes here precede spec changes
precede code.

## Authoring form (v0.4 class-based)

```html
<div class="sem-properties" data-kind="config">
  <div class="sem-property" data-key="token ttl">15m</div>
  <div class="sem-property" data-key="refresh rotation">per use</div>
  <div class="sem-property" data-key="storage">httpOnly cookie</div>
</div>
```

- `data-key`: required, free text (the term). Property text = the value.
- Compact sugar (conventions §3): `<div class="sem-property">token ttl
  :: 15m</div>` is legal; **`data-key` wins** when both present.
  v0.4 fallback does NOT parse `::` — sugar authors must use `data-key`
  for correct rendering until a parser ships.
- `data-kind` free token (`config`, `spec`, `env` …); `id`, `tags` global.
- ❓ Q2 resolved for v1: pure definition list, **no copy/search chrome**;
  revisit only if a consumer demands it.
- `data-view-as="glossary"` (R/W1): the block is a glossary. Each property
  should carry an `id`; prose elsewhere links a term with a plain anchor
  (`<a href="#g-jwt">JWT</a>`), optionally wrapping it in `<dfn>` at its
  defining use. Element form: `view-as="glossary"`.

## View contracts

### default

The definition list described below. No JS behaviour.

### `glossary`

- CSS: properties stack term-over-definition; a `<dfn>` inside the
  document renders as a term (upright, emphasised).
- Reading bundle (`dist/semtext-reading.js`): every anchor whose `href`
  targets a property `id` inside a glossary block gets the runtime class
  `.sem-properties-ref` and a hover / focus **preview popover**
  (`src/shared/popover.ts`) showing the key and the value; `Esc` closes
  it; the anchor still navigates. The container carries
  `data-sem-fallback` once wired.
- Lit `SemProperties` is a thin wrapper: claims `data-sem-upgraded`, then
  calls the same enhance function (idempotent per anchor).
- JS-off: definition list, `:target` highlight on the linked property, no
  popover. Nothing hidden.
- Extraction unchanged: a glossary property is a `sem-property` record;
  `view-as` never changes extraction.

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
- Glossary preview is `role="tooltip"`; the anchor carries
  `aria-describedby` while it is shown; opens on focus, closes on `Esc`.

## Machine contract

- Container = a closed set of key/value assertions; each property is one
  assertion (`data-key` = subject qualifier, text = value).
- Duplicate `data-key` values in one container = authoring error;
  fallback logs a console warning (non-fatal).
