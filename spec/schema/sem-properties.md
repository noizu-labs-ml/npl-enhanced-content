# Schema — `sem-properties` / `sem-property`

Contract per conventions.md v0.5. BDD source of truth for
`test/e2e/sem-properties.cy.js`. Changes here precede spec changes
precede code.

## Authoring form

```html
<sem-properties kind="config">
  <sem-property key="token ttl" role="definition" aria-label="token ttl">15m</sem-property>
  <sem-property key="refresh rotation" role="definition" aria-label="refresh rotation">per use</sem-property>
  <sem-property key="storage" role="definition" aria-label="storage">httpOnly cookie</sem-property>
</sem-properties>
```

Class-form alias (conventions Appendix A): `div.sem-properties[data-kind][data-view-as]` › `div.sem-property[data-key]`.

- `key`: required, free text (the term). Property text = the value.
- Compact sugar (conventions §3): `<sem-property>token ttl ::
  15m</sem-property>` is legal; **`key` wins** when both present.
  The fallback does NOT parse `::` — sugar authors must write `key`
  for correct rendering until a parser ships.
- `kind` free token (`config`, `spec`, `env` …); `id`, `tags` global.
- ❓ Q2 resolved for v1: pure definition list, **no copy/search chrome**;
  revisit only if a consumer demands it.
- `view-as="glossary"` (R/W1): the block is a glossary. Each property
  should carry an `id`; prose elsewhere links a term with a plain anchor
  (`<a href="#g-jwt">JWT</a>`), optionally wrapping it in `<dfn>` at its
  defining use.

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

## Rendered form

- **Zero-JS element.** Pure CSS: two-column grid — key column renders
  `attr(key)` (either spelling; muted, small-caps), value is the element text.
  Semantically a `<dl>` equivalent: each property authored as
  `role="definition"` + `aria-label` = the key — the label carries the
  term, the content the value.
- Alternating row surface tint; keys wrap, values keep whitespace.

## Events

None.

## A11y contract

- Each property authored as `role="definition"` with `aria-label` =
  the key — AT announces the pair without JS.
- `key` doubles as the machine-facing term.
- Glossary preview is `role="tooltip"`; the anchor carries
  `aria-describedby` while it is shown; opens on focus, closes on `Esc`.

## Machine contract

- Container = a closed set of key/value assertions; each property is one
  assertion (`key` = subject qualifier, text = value).
- Duplicate `key` values in one container = authoring error;
  fallback logs a console warning (non-fatal).
