# Schema — `npl-example`

Placeholder component proving the `npl-*` pattern end to end
(`src/lit/npl/npl-example.ts`). Delete this file together with the
component once real components exist; keep the recipe it demonstrates
(`src/lit/npl/index.ts` header, `spec/schema/npl/TEMPLATE.md`).

## Authoring form

```html
<npl-example label="hello">authored children survive beside the label</npl-example>
```

Class-form alias (conventions Appendix A, npl namespace):
`.npl-example[data-label]`.

- `label`: string — default `npl-example`. Displayed by
  `.npl-example-label` and mirrored to `data-label` (dual-form contract;
  the mirror is deferred past parse via afterParse so a sem-source
  snapshot never sees runtime writes).
- `id`, `kind`, `tags` per the global attribute catalog.

## Rendered form

- Enhanced: `<npl-example>` itself (Lit `NplExample` — light DOM, no
  shadow root): one `.npl-example-label` span rendering the resolved
  label; authored children stay untouched beside it.
- JS-off: block box from the npl section of `themes/_vocabulary.css`
  (`npl-example, .npl-example { display: block; }`). Nothing hidden,
  nothing generated.

## Events

- `npl-example-seen`: bubbles + composed; `detail`: `{ label: string }`
  (fired by `announce()`).
