# Project Layout

Top-level directories are domains: `spec/` says what the format is, `src/`
implements it, `themes/` styles it, `web/` publishes it, `test/` proves it.

```
semtext/
├── spec/                          # Canonical SemText format specifications (normative)
│   ├── conventions.md               # Authoring conventions — source of truth
│   ├── conventions.html             # The same spec rendered in the format it specifies
│   ├── extraction.md                # DOM → records → annotated text contract
│   └── schema/                      # Per-element semantic contracts (BDD source of truth)
│       ├── sem-details.md
│       ├── sem-facts.md
│       ├── sem-note.md
│       ├── sem-procedure.md
│       ├── sem-progress.md
│       ├── sem-properties.md
│       ├── sem-reveal.md
│       └── sem-views.md
├── src/
│   ├── index.ts                     # Lit-tier entry → dist/semtext.js
│   ├── lit/                         # Lit 3 light-DOM elements + SemElement base
│   │   ├── base.ts
│   │   ├── sem-details.ts
│   │   ├── sem-facts.ts
│   │   └── sem-note.ts
│   ├── fallback/                    # Vanilla tier — NO Lit dependency → dist/semtext-fallback.js
│   │   ├── index.ts
│   │   ├── details.ts
│   │   ├── facts.ts
│   │   ├── note.ts
│   │   ├── progress.ts
│   │   ├── properties.ts
│   │   ├── reveal.ts
│   │   └── views.ts
│   ├── extract/                     # Record extraction → dist/semtext-extract.js
│   │   ├── index.ts
│   │   └── records.ts
│   └── shared/                      # Tier-agnostic helpers used by both tiers
│       ├── audience.ts
│       ├── rng.ts
│       ├── state.ts
│       └── tokens.ts
├── themes/                          # Theme CSS — top-level on purpose (see note below)
│   ├── _vocabulary.css
│   └── minimal-tech-light.css
├── web/
│   ├── demo/                        # Showcase + reference documents (marker sources)
│   │   ├── index.html                 # v0.4 class-based baseline, fallback tier
│   │   └── standalone-lit.html        # Lit-tier upgrade page
│   └── site/
│       └── index.html                 # semtext.dev marketing page (PLACEHOLDER)
├── test/                            # Cypress e2e — 11 specs
│   ├── e2e/
│   │   ├── extraction.cy.js
│   │   ├── nojs-artifact.cy.js
│   │   ├── sem-details.cy.js
│   │   ├── sem-facts.cy.js
│   │   ├── sem-note.cy.js
│   │   ├── sem-procedure.cy.js
│   │   ├── sem-progress.cy.js
│   │   ├── sem-properties.cy.js
│   │   ├── sem-reveal.cy.js
│   │   ├── sem-views.cy.js
│   │   └── standalone-lit.cy.js
│   └── support/e2e.js
├── scripts/
│   ├── build.mjs                    # Three IIFE artifacts + size budgets
│   └── build-standalone.mjs         # Marker expansion → dist/demo/ and dist/site/
├── docs/                            # Maintained project docs (+ .summary.md pairs)
│   ├── PROJ-ARCH.md
│   ├── PROJ-LAYOUT.md               # This file
│   └── PROJ-SCHEMA.md
├── cypress.config.js                # Spec pattern test/e2e/, support test/support/
├── vite.config.ts                   # Dev/preview only — the build lives in scripts/
├── tsconfig.json
├── package.json                     # Subpath exports: ./lit ./fallback ./extract ./themes/*
├── PRD.md
├── ROADMAP.md
├── CLAUDE.md · AGENTS.md · AGENT.md
└── README.md                        # (absent — PRD.md serves as entry point)
```

## Directory Notes

| Directory | Purpose |
|-----------|---------|
| `spec/` | Tier-0 normative documents. This repo is spec-first: schema change precedes conventions change precedes code precedes e2e. |
| `src/lit/` | Lit 3 elements, light DOM so content stays searchable and extractable. Bundled with Lit into `dist/semtext.js`. |
| `src/fallback/` | The vanilla tier. It must run in a document that never loads Lit, so it may not import from `src/lit/` — the separation is load-bearing, not stylistic. |
| `src/extract/` | DOM → records → annotated text, per `spec/extraction.md`. |
| `src/shared/` | Helpers imported by both tiers; must stay Lit-free for the same reason as `fallback/`. |
| `themes/` | Deliberately top-level rather than under `web/`: theme CSS is a package subpath export (`semtext/themes/*`) and a CDN asset on cdn.semtext.dev, consumed independently of the marketing site. |
| `web/demo/` | Double duty by design — showcase pages *and* the cypress fixture source. The suite runs against the BUILT copies in `dist/demo/`, which is the only arrangement where a green suite proves the shipped file works. |
| `web/site/` | Marketing page for semtext.dev. Currently a placeholder; the design pass is a separate task. |
| `test/` | Cypress e2e against `dist/demo/`, mirroring the per-element BDD in `spec/schema/`. |
| `scripts/` | The real build. `vite.config.ts` covers dev/preview only. |

## Build Outputs (gitignored, not documented above)

- `dist/semtext.js` · `dist/semtext-fallback.js` · `dist/semtext-extract.js` — three independent IIFE classic scripts
- `dist/demo/<name>.html` and `dist/demo/<name>.nojs.html` — inlined single-file documents
- `dist/site/index.html` — the marketing page
- `test/screenshots/` · `test/videos/` — cypress artifacts, generated at test time
- `node_modules/`

## Commands

| Command | Action |
|---------|--------|
| `npm run build` | `scripts/build.mjs` then `scripts/build-standalone.mjs` → `dist/` |
| `npm run build:strict` | Same, but a size-budget overrun fails the build |
| `npm test` | Cypress e2e run (requires `npm run serve` on port 4173) |
| `npm run serve` | Vite preview of `dist/` on port 4173 |
