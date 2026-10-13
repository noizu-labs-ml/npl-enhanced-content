# Schema — `npl-ref`

Display-only rendering of an NPL ref block: post-hoc reflection over a
finished turn (assessment, improvements, validation, eval, fine-tune).
Contract per conventions.md v0.6 and the namespace recipe in
`src/lit/npl/index.ts`; component at `src/lit/npl/npl-ref.ts`.

## Authoring form

```html
<npl-ref variant="full">
  <assessment>the approach held; one gap in the eval loop</assessment>
  <improvements>add a regression harness before the next run</improvements>
  <validation>checked against three traces</validation>
  <eval>quality 0.82 vs 0.71 baseline</eval>
  <fine-tune>retrain on the two rejected traces</fine-tune>
</npl-ref>
```

Sections are authored as the element's direct children, in either spelling
(tag form `<assessment>`, alias form `.npl-assessment` — conventions
Appendix A): `assessment`, `improvements`, `validation`, `eval`,
`fine-tune`. Any subset; rendering follows authored order. Content that is
not a section is left untouched.

Class-form alias (conventions Appendix A, npl namespace):
`.npl-ref[data-variant]` — same dual-form contract as the sem-* tier,
`data-<name>` wins when both spellings are present.

- `variant`: `full|compact` — default `full`. `full` renders each section
  as a labelled block; `compact` renders one emoji line per section.
  Any other value resolves to `full`, and the resolved variant mirrors to
  `data-variant` (deferred past parse via afterParse, like sem-note, so a
  sem-source snapshot never sees runtime writes). The variant is read at
  upgrade; it is display-only and not switched after wiring.
- `id`, `kind`, `tags` per the global attribute catalog.

## Rendered form

- Enhanced (full): `<npl-ref>` itself (Lit `NplRef` — light DOM, no
  shadow root). Each authored section becomes
  `.npl-ref-section[data-section]` with a generated `.npl-ref-label`
  header; authored markup is never moved or dropped, so the reflection
  stays searchable and copyable.
- Enhanced (compact): the authored sections are hidden and one
  `.npl-ref-line` per section is appended as a `.npl-ref-lines` list —
  `🧭 Assessment`, `✨ Improvements`, `✅ Validation`, `🧪 Eval`,
  `🎯 Fine-tune` — each line the emoji, the label, and the section's
  flattened text.
- JS-off: the block box from the npl section of `themes/_vocabulary.css`
  (`npl-ref, .npl-ref { display: block; }`). Nothing hidden, nothing
  generated — authored sections read as plain prose.
