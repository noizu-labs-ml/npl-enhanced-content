# Data Schema — npl-enhanced-content

No relational persistence, KV store, or runtime config layer exists in this
repo. The repo is **spec-first**: its primary "schema" is the markup/data
interface contract for NPL-enhanced XHTML documents. Repo layout:
[PROJ-LAYOUT.md](PROJ-LAYOUT.md).

| Data kind | Source | Documented here |
|-----------|--------|-----------------|
| Data interface schema (markup contract) | `syntax/conventions.md`, `syntax/schema/npl-note.md` | §1, §2 |
| Data files (canonical spec HTML) | `syntax/conventions.html`, `demo/index.html` | §3 |
| Config file schemas | `package.json`, `vite.config.ts`, `tsconfig.json`, `cypress.config.js` | §4 |
| Persistence / KV | — (none) | — |

## 1. Document interface schema (conventions.md v0.4)

NPL-enhanced documents are XHTML readable by three consumers: browser (styled/
interactive), LLM (structural), terminal. Canonical form: **class-based**
(`div.npl-*` on plain elements) with `data-*` attribute parameters; semantic
custom elements (`<npl-fact>`) are the target vocabulary for the Lit milestone.

### v0.3 element → v0.4 class mapping

| Element form | Class markup |
| :-- | :-- |
| `<npl-enhanced-document>` | `div.npl-enhanced-document` (required root wrapper) |
| `<agent>` + name/bio/instructions | `div.npl-agent` › `.npl-agent-name` / `-bio` / `-instructions` |
| `<npl-note variant="warning">` | `div.npl-note[data-variant="warning"]` › `.npl-note-body` |
| `<npl-facts view-as="quiz">` | `div.npl-facts[data-view-as="quiz"]` |
| `<npl-fact>` statement/conclusion | `div.npl-fact` › `.npl-statement` / `.npl-conclusion` |
| `<npl-distractor>` | `div.npl-distractor` |
| `<npl-details>` / `<npl-detail>` | `div.npl-details` › `div.npl-detail` |
| `<highlight>` | `span.npl-highlight` (occluded form `.npl-occluded`) |

### Global attribute catalog (any npl-* element)

| Attribute | Values | Machine meaning |
| :-- | :-- | :-- |
| `kind` | free token (`concept`, `anti-pattern`, `caveat`, …) | what the data IS |
| `tags` | comma list | classification |
| `view-as` | element-defined modes (`quiz`, `flashcards`, `list`, …) | presentation parameter; unknown ⇒ fallback to list + warning |
| `status` | `done`, `current`, `todo`, `blocked`, `pass`, `fail` | lifecycle/verdict |
| `controls` | comma flags: `shuffle`, `filter`, `retry`, `picker` | which controls render |
| `collapsed` | boolean | pre-collapse state |
| `id` | doc-unique token | stable anchor, cite target |
| `data-*` | free | extension point |

Rule: **attributes are canonical; inline `[hint | reveal]` NPL notation is
sugar** and legal only where the element schema allows.

## 2. `npl-note` element schema (syntax/schema/npl-note.md, contract v0.3)

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `variant` | `info` \| `warning` \| `tip` \| `danger` | `info` | accent border + `data-variant` |
| `collapsed` | boolean attr | unset | body wraps in native `<details>`; summary = first text line, max 60 chars |
| `id`, `kind`, `tags` | global catalog | — | see §1 |
| `role` | `note` | set on upgrade by Lit component; authored pre-set for JS-off machine readers | a11y contract |
| Events | — | none | |

Rendered forms: upgraded (Lit `NplNote`, light DOM — no shadow root, content
searchable); pre-upgrade/JS-off (`npl-note:not(:defined)` base styles via
attribute selectors). BDD source of truth for `cypress/e2e/npl-note.cy.js`.
Change order: schema → spec → code.

## 3. Data files

| Path | Purpose | Shape |
|------|---------|-------|
| `syntax/conventions.md` | Authoring spec source of truth (v0.4 draft) | Markdown, 10 sections + open questions |
| `syntax/conventions.html` | Rendered conventions (XHTML canonical) | XHTML document exercising the vocabulary |
| `demo/index.html` | Reference implementation of the class-based v0.4 baseline | Single-file XHTML: inline core CSS + Tailwind CDN `@apply` layer + `npl-fallback` vanilla JS |

## 4. Config file schemas

### package.json

| Field | Value |
|-------|-------|
| `type` | `module` |
| `exports` | `.` → `dist/npl.js`, `./preprocess` → `dist/preprocess.js`, `./themes/*` → `themes/*` |
| `files` | `dist`, `themes` |
| `dependencies` | `lit ^3.3.3` |
| `devDependencies` | `cypress ^14`, `typescript ^5.6`, `vite ^6` |
| scripts | `build` (vite build), `test` / `test:open` (cypress e2e), `serve` (vite preview :4173) |

### Tool configs

| File | Key settings |
|------|--------------|
| `vite.config.ts` | Library build → `dist/`; serves `demo/` |
| `tsconfig.json` | TypeScript compile options for vite build |
| `cypress.config.js` | E2E spec path `cypress/e2e`, baseUrl pointed at the vite preview server |

## Maintenance

- Updates here must follow changes to `syntax/` specs (spec precedes code).
- If a persistence layer, KV store, or server API is added, add the
  corresponding section per PROJ-SCHEMA conventions (ERD / key-pattern /
  interface tables).
