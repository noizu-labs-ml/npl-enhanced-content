# Schema — `npl-procedure` / `npl-step`

Contract per conventions.md v0.4. BDD source of truth for
`cypress/e2e/npl-procedure.cy.js`. Changes here precede spec changes
precede code.

## Authoring form (v0.4 class-based)

```html
<div class="npl-procedure" data-kind="runbook">
  <div class="npl-step" data-status="done">provision Infisical path</div>
  <div class="npl-step" data-status="current">port-forward MinIO</div>
  <div class="npl-step">run migrations</div>
  <div class="npl-step" data-status="blocked">cut release — waiting on CI</div>
</div>
```

- `data-status`: `done` | `current` | `todo` (default) | `blocked`.
- Status sugar (conventions §3) inside step text — `✅ …` = done,
  `→ …` = current, `❌ …` = blocked — **is sugar only**; `data-status`
  is canonical. Authors pick one. Fallback handler v0.4 does NOT parse
  sugar; authors wanting sugar write the attr too.
- `data-kind` free token (`runbook`, `recipe`, `migration` …).
- `id`, `tags` per global attribute catalog.
- **DOM order = execution order.** No step-number attribute; ordinals
  are positional (CSS counters render them).

## Rendered form (v0.4)

- **Zero-JS element.** Pure CSS: `role="list"` container, each step
  `role="listitem"`, ordinal via CSS counter, status glyph via
  `[data-status]::before` (✓ done · → current · ⛔ blocked · ○ todo).
- `data-status="current"` step gets accent border; `blocked` muted-red.
- Lit milestone may add click-to-toggle status; not in v0.4.

## Events

None (v0.4).

## A11y contract

- `role="list"` / `role="listitem"` authored in markup (no JS needed).
- Status conveyed by glyph **and** `data-status` attribute (machine +
  AT via text alternative).

## Machine contract

- Container = one ordered procedure; children in DOM order are steps.
- `data-status` per step is the lifecycle annotation; a procedure with
  any `blocked` step is itself blocked (derivable, not authored).
