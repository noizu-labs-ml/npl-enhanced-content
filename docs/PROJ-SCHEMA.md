# Data Schema — SemText

No relational persistence, KV store, or runtime config layer exists in this
repo. The repo is **spec-first**: its primary "schema" is the markup/data
interface contract for NPL-enhanced XHTML documents. Repo layout:
[PROJ-LAYOUT.md](PROJ-LAYOUT.md).

| Data kind | Source | Documented here |
|-----------|--------|-----------------|
| Data interface schema (markup contract) | `spec/conventions.md`, `spec/schema/sem-note.md` | §1, §2 |
| Data files (canonical spec HTML) | `spec/conventions.html`, `web/demo/index.html` | §3 |
| Config file schemas | `package.json`, `vite.config.ts`, `tsconfig.json`, `cypress.config.js` | §4 |
| Persistence / KV | — (none) | — |

## 1. Document interface schema (conventions.md v0.4)

NPL-enhanced documents are XHTML readable by three consumers: browser (styled/
interactive), LLM (structural), terminal. Canonical form: **class-based**
(`div.sem-*` on plain elements) with `data-*` attribute parameters; semantic
custom elements (`<sem-fact>`) are the target vocabulary for the Lit milestone.

### v0.3 element → v0.4 class mapping

| Element form | Class markup |
| :-- | :-- |
| `<sem-enhanced-document>` | `div.sem-enhanced-document` (required root wrapper) |
| `<agent>` + name/bio/instructions | `div.sem-agent` › `.sem-agent-name` / `-bio` / `-instructions` |
| `<sem-note variant="warning">` | `div.sem-note[data-variant="warning"]` › `.sem-note-body` |
| `<sem-facts view-as="quiz">` | `div.sem-facts[data-view-as="quiz"]` |
| `<sem-fact>` statement/conclusion | `div.sem-fact` › `.sem-statement` / `.sem-conclusion` |
| `<sem-distractor>` | `div.sem-distractor` |
| `<sem-details>` / `<sem-detail>` | `div.sem-details` › `div.sem-detail` |
| `<highlight>` | `span.sem-highlight` (occluded form `.sem-occluded`) |

### Global attribute catalog (any sem-* element)

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

## 2. `sem-note` element schema (spec/schema/sem-note.md, contract v0.3)

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `variant` | `info` \| `warning` \| `tip` \| `danger` | `info` | accent border + `data-variant` |
| `collapsed` | boolean attr | unset | body wraps in native `<details>`; summary = first text line, max 60 chars |
| `id`, `kind`, `tags` | global catalog | — | see §1 |
| `role` | `note` | set on upgrade by Lit component; authored pre-set for JS-off machine readers | a11y contract |
| Events | — | none | |

Rendered forms: upgraded (Lit `SemNote`, light DOM — no shadow root, content
searchable); pre-upgrade/JS-off (`sem-note:not(:defined)` base styles via
attribute selectors). BDD source of truth for `test/e2e/sem-note.cy.js`.
Change order: schema → spec → code.

## 3. Data files

| Path | Purpose | Shape |
|------|---------|-------|
| `spec/conventions.md` | Authoring spec source of truth (v0.4 draft) | Markdown, 10 sections + open questions |
| `spec/conventions.html` | Rendered conventions (XHTML canonical) | XHTML document exercising the vocabulary |
| `web/demo/index.html` | Reference implementation of the class-based v0.4 baseline | Single-file XHTML: inline core CSS + Tailwind CDN `@apply` layer + `sem-fallback` vanilla JS |

## 4. Config file schemas

### package.json

| Field | Value |
|-------|-------|
| `type` | `module` |
| `exports` | `./lit` → `dist/semtext.js`, `./fallback` → `dist/semtext-fallback.js`, `./extract` → `dist/semtext-extract.js`, `./themes/*` → `themes/*`. No `.` export — each artifact is a classic IIFE script that installs a global and exports nothing (D9). |
| `files` | `dist`, `themes` |
| `dependencies` | `lit ^3.3.3` |
| `devDependencies` | `cypress ^14`, `typescript ^5.6`, `vite ^6` |
| scripts | `build` (`scripts/build.mjs` + `scripts/build-standalone.mjs`), `build:strict` (same, budget-enforcing), `test` / `test:open` (cypress e2e), `serve` (vite preview :4173) |

### Tool configs

| File | Key settings |
|------|--------------|
| `vite.config.ts` | Dev/preview only — the three-artifact build lives in `scripts/build.mjs` |
| `tsconfig.json` | TypeScript compile options for vite build |
| `cypress.config.js` | E2E spec path `test/e2e`, baseUrl pointed at the vite preview server |

## Maintenance

- Updates here must follow changes to `spec/` specs (spec precedes code).
- If a persistence layer, KV store, or server API is added, add the
  corresponding section per PROJ-SCHEMA conventions (ERD / key-pattern /
  interface tables).
