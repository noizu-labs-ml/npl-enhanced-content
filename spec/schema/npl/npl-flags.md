# Schema — `npl-flags`

Contract per conventions.md v0.6 and the namespace recipe in
`src/lit/npl/index.ts`. Container for `npl-flag` children
(`npl-flag.md`) plus optional note text. Mirrors the sem-* prose
contracts in `spec/schema/*.md`: prose is normative — changes here
precede spec changes precede code, and this file is the BDD source of
truth for `test/unit/npl-flags.test.ts`.

## Authoring form

```html
<npl-flags preset="production">
  <npl-flag name="calm_factor" value="0.5"></npl-flag>
  tuning notes…
</npl-flags>
```

Class-form alias (conventions Appendix A, npl namespace):
`.npl-flags[data-preset]` — same dual-form contract as the sem-* tier,
`data-preset` wins when both spellings are present.

- `preset`: `<string>` — no default (omit it entirely for no badge). One
  of `minimal | full | production | creative | tireless` (the NPL flag
  source spells these `preset:<name>`; the attribute accepts the bare
  word or the prefixed spelling, normalized for display). An unknown
  preset is NOT an error: it warns through the author-facing channel and
  renders with the `npl-flags-preset-invalid` warning class.
- `id`, `kind`, `tags` per the global attribute catalog — no bullet needed.

## Rendered form

- Enhanced: `<npl-flags>` itself (Lit `NplFlags` — light DOM, no shadow
  root; content stays searchable/copyable; generated chrome uses the
  `.npl-flags-preset` class, `.npl-flags-preset-invalid` when the preset
  is unknown). `npl-flag` children and note text stay in place beside it.
- JS-off: the block box from the npl section of `themes/_vocabulary.css`
  (`npl-flags, .npl-flags { display: block; }`). Nothing hidden, nothing
  generated — authored flags and notes read as plain prose.
