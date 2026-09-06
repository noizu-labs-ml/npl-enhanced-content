# Schema — `sem-reveal`

Contract per conventions.md v0.4. BDD source of truth for
`cypress/e2e/sem-reveal.cy.js`. Changes here precede spec changes
precede code.

## Authoring form (v0.4 class-based)

```html
<div class="sem-reveal" data-summary="Why not localStorage?">
  Tokens in localStorage are readable by any script on the page…
</div>
```

- `data-summary`: optional label. **Fallback: first line of body (max
  60 chars) acts as summary when absent.**
- `collapsed`: boolean attr — starts hidden (the `sem-note[collapsed]`
  convention carries over). Without it the reveal starts **open**.
- `id`, `kind`, `tags` global.

## Rendered form (v0.4)

- Fallback JS wraps the element in a native `<details>`/`<summary>` —
  summary text from `data-summary` or first-line derivation; `open`
  preset unless `collapsed`. Click/keyboard toggling is then native.
- JS-off: **content fully visible**; `data-summary`, when present,
  renders as a small-caps heading via CSS `::before`. JS-off + no
  `data-summary`: plain prose, nothing hidden.
- `sem-note[collapsed]` vs `sem-reveal[collapsed]`: note = annotation
  tone (variant border); reveal = neutral Q→A disclosure. Same
  mechanism, different semantic — machines distinguish intent.

## Events

None (native `<details>` `toggle` event is the upgrade-time signal).

## A11y contract

- Native `<details>`/`<summary>` after fallback wrap — keyboard
  operable, `aria-expanded` implied by the platform.
- JS-off: nothing is hidden, so no disclosure hazard.

## Machine contract

- `data-summary` (or derived first line) = the question/label; body =
  the answer. Extractable as a Q/A pair, same shape as `sem-fact`
  statement/conclusion but *non-assertive* (a reveal is exposition,
  not an assertion).
