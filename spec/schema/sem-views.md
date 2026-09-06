# Schema — `sem-views` / `sem-view`

Contract per conventions.md v0.4. BDD source of truth for
`test/e2e/sem-views.cy.js`. Changes here precede spec changes precede
code.

❓ Q3 resolved for v1: **`sem-views`** (not `sem-perspectives`) — shorter,
`data-name` reads naturally, tab-family semantics are the intent.

## Authoring form (v0.4 class-based)

```html
<div class="sem-views" id="deploy">
  <div class="sem-view" data-name="Helm" data-active>content…</div>
  <div class="sem-view" data-name="ArgoCD">content…</div>
</div>
```

- `data-name`: required, unique within the container, human label.
- `data-active`: boolean marker on the initially-visible view; **if no
  view carries it, the first view is active** (fallback normalizes by
  setting `data-active` on the first).
- `id`: required for deep-links (`#deploy/argocd`); `kind`, `tags` global.
- Any content is legal inside a view — including other `sem-*` elements.
- Exactly one view active at a time; two `data-active` ⇒ fallback keeps
  the first, warns.

## Rendered form (v0.4)

- Fallback JS builds a tab bar (`.sem-views-tabs`) as the container's
  first child: one button per view, `aria-selected` follows
  `data-active`.
- Active view: `display:block`; inactive: `display:none`.
- JS-off: **all views render, stacked, each headed by its `data-name`**
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
- `data-active` in markup is the pre-JS state marker; JS-off everything
  is visible so no hidden-content AT hazard.

## Machine contract

- `sem-views` = same subject under named perspectives; each `data-name`
  is the perspective token. Deep-link form `#<id>/<name>` is canonical
  for citation.
