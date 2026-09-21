# Schema — `sem-views` / `sem-view`

Contract per conventions.md v0.5. BDD source of truth for
`test/e2e/sem-views.cy.js`. Changes here precede spec changes precede
code.

❓ Q3 resolved for v1: **`sem-views`** (not `sem-perspectives`) — shorter,
`name` reads naturally, tab-family semantics are the intent.

## Authoring form

```html
<sem-views id="deploy">
  <sem-view name="Helm" active role="tabpanel">content…</sem-view>
  <sem-view name="ArgoCD" role="tabpanel">content…</sem-view>
</sem-views>
```

Class-form alias (conventions Appendix A): `div.sem-views[id]` › `div.sem-view[data-name][data-active]`.

- `name`: required, unique within the container, human label.
- `active`: boolean marker on the initially-visible view; **if no view
  carries it, the first view is active**. The shown view is tracked at
  runtime in `data-active` (the fallback mirrors an authored `active`
  there, then moves it on every switch); the authored attribute is never
  rewritten.
- `id`: required for deep-links (`#deploy/argocd`); `kind`, `tags` global.
- Any content is legal inside a view — including other `sem-*` elements.
- Exactly one view active at a time; two `active` ⇒ fallback keeps
  the first, warns.

## Rendered form

- Fallback JS builds a tab bar (`.sem-views-tabs`) as the container's
  first child: one button per view, `aria-selected` follows
  `data-active`.
- Active view: `display:block`; inactive: `display:none`.
- JS-off: **all views render, stacked, each headed by its `name`**
  (readability over interactivity — degradation rule §4).

## Events

- `sem-navigate {id, name, index}` — fired on every active-view change
  (click, keyboard, or hash).

## A11y contract

- Authored in markup: container `role="tablist"`? No — tablist must own
  the tab buttons, which the fallback creates; the container itself is a
  region (`aria-label` = `id`). Fallback sets `role="tab"` on buttons,
  `role="tabpanel"` + `aria-labelledby` on views, and manages arrow-key
  roving focus.
- `active` in markup is the pre-JS state marker; JS-off everything
  is visible so no hidden-content AT hazard.

## Machine contract

- `sem-views` = same subject under named perspectives; each `name`
  is the perspective token. Deep-link form `#<id>/<name>` is canonical
  for citation.
