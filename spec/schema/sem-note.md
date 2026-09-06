# Schema — `sem-note`

Contract per conventions.md v0.3. BDD source of truth for
`test/e2e/sem-note.cy.js`. Changes here precede spec changes precede code.

## Authoring form (canonical — no preprocessing layer)

```html
<sem-note variant="warning">body HTML</sem-note>
<sem-note variant="tip" collapsed>body HTML</sem-note>
```

- `variant`: `info` (default) | `warning` | `tip` | `danger`.
- `collapsed`: boolean attr — body wraps in native `<details>`; summary =
  first text line, max 60 chars.
- `id`, `kind`, `tags` per global attribute catalog.
- `[hint | reveal]` notation: this element hosts the first definition of the
  agent-instruction notation (conventions.md §3) — parse in v1 only if the
  fallback handler ships it for free; otherwise defer.

## Rendered form

- Upgraded: `<sem-note>` itself (Lit `SemNote` — minimal: variant icon,
  collapsed behavior). No shadow root; light DOM, content searchable.
- Pre-upgrade / JS-off: `sem-note:not(:defined)` base in theme CSS — accent
  border + variant label via attribute selectors.
- `role="note"`: component sets on upgrade; docs author it pre-set so machine
  readers see the role without JS.

## Events

None.

## A11y contract

- `role="note"` present in DOM (authored or set on upgrade).
- Variant by accent + `data-variant`; no aria-live.
- Collapsed form native `<details>` — keyboard operable.

## Machine contract

- `variant` + `kind` read as qualified annotation; statement content is the
  assertion text.
