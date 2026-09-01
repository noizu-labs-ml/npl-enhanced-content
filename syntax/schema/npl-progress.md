# Schema — `npl-progress`

Contract per conventions.md v0.4. BDD source of truth for
`cypress/e2e/npl-progress.cy.js`. Changes here precede spec changes
precede code.

## Authoring form (v0.4 class-based)

```html
<div class="npl-progress" data-value="0.62" data-label="coverage"></div>
```

- `data-value`: **required, canonical unit 0..1.** Out-of-range values
  clamp for rendering; the raw attr stays untouched (machine readers
  see the author's value, the render shows the clamp).
- `data-label`: optional; default `progress`.
- `id`, `kind`, `tags` global.
- Status semantics pair naturally: `data-status="done"` renders the
  full/accent state (same catalog as `npl-step`).

## Rendered form (v0.4)

- Fallback JS builds a meter: track bar + fill width `value*100%` +
  text `label :: 62%` (percentage, rounded).
- JS-off: **text-only via CSS** — `content: attr(data-label) " :: "
  attr(data-value)` rendered in the element (no fake bar, no lie).
- Lit milestone may animate fill transitions; v0.4 static.

## Events

None (v0.4).

## A11y contract

- `role="meter"` authored in markup with `aria-valuemin="0"`,
  `aria-valuemax="1"`, `aria-valuenow` = value, `aria-label` = label —
  pre-set so AT works JS-off.
- Percentage text is the accessible text alternative.

## Machine contract

- One scalar completion assertion: `label ∈ [0,1]`. Embedded docs use
  it for checklist/pipeline state (pairs with `npl-procedure`
  statuses); `data-status="done"` ⇔ value 1 by convention.
