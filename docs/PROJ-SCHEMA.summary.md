# Data Schema — Summary

Spec-first repo; no relational/KV persistence. Schema = markup contract for
NPL-enhanced XHTML (see [PROJ-SCHEMA.md](PROJ-SCHEMA.md), layout in
[PROJ-LAYOUT.md](PROJ-LAYOUT.md)).

## Core entities

- **Enhanced document** — root `<sem-enhanced-document>` (alias `div.sem-enhanced-document`); metadata children (`agent`, …) + semantic HTML + `sem-*` vocabulary. Canonical form (conventions v0.5): custom elements with **bare attributes** (`<sem-facts view-as="quiz">`, `<sem-step status="done">`).
- **Class-form alias** — the v0.4 spelling (`div/span.sem-*` with `data-*` parameters) maps mechanically from the tag form (conventions Appendix A); every tier accepts it; `data-*` wins when both spellings are present; runtime state is always `data-*`.
- **Extraction** — 20 minting types; `sem-reader` is chrome (skipped whole); `sem-source` is transparent (children extract as if unwrapped); `sem-table` rows return in authored order via `data-sem-source-index` (the one DOM-reorder exception).
- **Global attributes** — `kind`, `tags`, `view-as` (unknown ⇒ list fallback), `status` (`done|current|todo|blocked|pass|fail`), `controls`, `collapsed`, `id`, `data-*`. Attributes canonical; inline notation is sugar.

## sem-note schema

```mermaid
erDiagram
    SEM_NOTE ||--o| DETAILS : "collapsed wraps body"
    SEM_NOTE {
        ENUM_VARIANT variant "info|warning|tip|danger, default info"
        BOOLEAN collapsed "native details, 60-char summary"
        TOKEN id "doc-unique anchor"
        TOKEN kind "global catalog"
        TAGS tags "comma list"
        ROLE role "note; set on upgrade"
    }
```

Events: none. Light DOM (searchable). BDD source for `test/e2e/sem-note.cy.js`.

## Data files & configs

| Item | Kind |
|------|------|
| `spec/conventions.md` (v0.5) + `.html` | canonical spec (md source; the .html is a tag-form SemText document) |
| `web/demo/index.html` | reference impl: core CSS + Tailwind CDN layer + vanilla fallback JS |
| `package.json` exports | subpaths only — `./lit` `./fallback` `./extract` `./themes/*` (no `.`); files `dist`, `themes`; dep `lit ^3.3.3` |
| `vite.config.ts` / `tsconfig.json` / `cypress.config.js` | build / types / e2e config |
