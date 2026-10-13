# Schema — `npl-cot`

Chain-of-thought block: the steps of an NPL `cot` block's `thought_process`
plus its outcome, folded in a native `<details>`. Lit component:
`src/lit/npl/npl-cot.ts`; toggle is native, so it works without JavaScript.

## Authoring form

```html
<npl-cot collapsed>
  <sem-step>first thought_process step</sem-step>
  <sem-step>second thought_process step</sem-step>
  <div outcome>the answer the steps arrive at</div>
</npl-cot>
```

Class-form alias (conventions Appendix A, npl namespace):
`.npl-cot[data-collapsed]` — same dual-form contract as the sem-* tier,
`data-collapsed` wins when both spellings are present.

Children: the thought_process steps — each a step element (any element
child not marked as the outcome; `sem-step` is the conventional tag) — and
at most one outcome element: an authored child carrying the `outcome`
(or `data-outcome`) attribute, whatever its tag.

- `collapsed`: boolean — default `false` (present ⇒ the block starts
  collapsed). Sets the **initial** open state of the native details; the
  user's own toggling is never re-forced. Mirrored to `data-collapsed`
  (`"true"`/`"false"`) in `updated()` via afterParse (dual-form contract;
  the mirror is deferred past parse so a sem-source snapshot never sees
  runtime writes).
- `id`, `kind`, `tags` per the global attribute catalog — no bullet needed.

## Rendered form

- Enhanced: `<npl-cot>` itself (Lit `NplCot` — light DOM, no shadow root).
  Chrome is one native `details.npl-cot-details` with a
  `.npl-cot-summary` (`Chain of thought (N steps)`, N = authored step count)
  and a `.npl-cot-steps` host; the authored step elements are moved inside
  the details. The outcome element (if authored) is moved to a
  `.npl-cot-outcome-slot` **outside** the details, so the answer stays
  visible while the reasoning is collapsed. Collapsed content is hidden by
  the native details itself — no JS event handling behind the toggle.
- JS-off: the block box from the npl section of `themes/_vocabulary.css`
  (`npl-cot, .npl-cot { display: block; }`). Nothing hidden, nothing
  generated — the steps and the outcome read as plain prose blocks.
