# Schema — `sem-reveal`

Contract per conventions.md v0.5. BDD source of truth for
`test/e2e/sem-reveal.cy.js`. Changes here precede spec changes
precede code.

## Authoring form

```html
<sem-reveal summary="Why not localStorage?" collapsed>
  Tokens in localStorage are readable by any script on the page…
</sem-reveal>
```

Class-form alias (conventions Appendix A): `div.sem-reveal[data-summary]`, same `collapsed` attribute.

- `summary`: optional label. **Fallback: first line of body (max
  60 chars) acts as summary when absent.**
- `collapsed`: boolean attr — starts hidden (the `sem-note[collapsed]`
  convention carries over). Without it the reveal starts **open**.
- `id`, `kind`, `tags` global.

## Rendered form

- Fallback JS wraps the element in a native `<details>`/`<summary>` —
  summary text from `summary` or first-line derivation; `open`
  preset unless `collapsed`. Click/keyboard toggling is then native.
- JS-off: **content fully visible**; `summary`, when present,
  renders as a small-caps heading via CSS `::before` (either spelling).
  JS-off + no `summary`: plain prose, nothing hidden.
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

- `summary` (or derived first line) = the question/label; body =
  the answer. Extractable as a Q/A pair, same shape as `sem-fact`
  statement/conclusion but *non-assertive* (a reveal is exposition,
  not an assertion).
