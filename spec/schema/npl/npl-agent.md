# Schema — `npl-agent`

Contract per conventions.md v0.6 and the namespace recipe in
`src/lit/npl/index.ts`.

## Authoring form

```html
<npl-agent name="scout" type="scout" version="0.3" extends="base-agent">
Long-form description and behavioural spec prose.
</npl-agent>
```

Marks up the NPL agent convention's source form
`⌜scout|scout|NPL@0.3⌝ … ⌞scout⌟` as HTML: the three header fields become
attributes, the body carries the description and behavioural spec prose.
Display-only.

Class-form alias (conventions Appendix A, npl namespace):
`.npl-agent[data-attr]` — same dual-form contract as the sem-* tier,
`data-<name>` wins when both spellings are present.

- `name`: `string` — required. The agent's identifier, the `⌜<agent-name>`
  field of the source form.
- `type`: `string` — required. The agent's archetype (e.g. `scout`,
  `coder`).
- `version`: `string` — required. The NPL contract version, the
  `NPL@{version}` field of the source form.
- `extends`: `string` — optional. The parent agent this definition
  extends; the header omits it when not authored.
- `id`, `kind`, `tags` per the global attribute catalog — no bullet needed.

## Rendered form

- Enhanced: `<npl-agent>` itself (Lit `NplAgent` — light DOM, no shadow
  root; content stays searchable/copyable). Generates one chrome element,
  `.npl-agent-header` (parts `.npl-agent-name`, `.npl-agent-type`,
  `.npl-agent-version`, `.npl-agent-extends`), before the body; the
  `.npl-agent-extends` part is absent when no parent is authored. The body
  is the authored children — description and behavioural spec prose —
  left as plain light DOM, never wrapped or moved.
- JS-off: the block box from the npl section of `themes/_vocabulary.css`
  (`npl-agent, .npl-agent { display: block; }`). Nothing hidden, nothing
  generated — authored text reads as plain prose.
