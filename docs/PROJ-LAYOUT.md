# Project Layout

```
npl-enhanced-content/
├── syntax/                       # Canonical NPL enhanced-content specifications
│   ├── conventions.html          # Rendered conventions spec (XHTML-first canonical)
│   ├── conventions.md            # Markdown conventions spec (source of truth)
│   └── schema/
│       └── sem-note.md           # SemNote element schema definition
├── demo/
│   └── index.html                # Standalone Lit SemNote demo page (vite-served)
├── cypress/
│   └── e2e/
│       └── sem-note.cy.js        # E2E tests for the SemNote component
├── docs/                         # Project documentation (this sweep)
│   ├── PROJ-ARCH.md              # Architecture overview
│   ├── PROJ-LAYOUT.md            # This file
│   └── PROJ-SCHEMA.md            # Data/config schema overview
├── cypress.config.js             # Cypress E2E configuration
├── vite.config.ts                # Vite build config (library + demo)
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # NPM package: lit dep, build/test/serve scripts
├── PRD.md                        # Product requirements document
├── CLAUDE.md                     # Claude Code repo guidance
└── README.md                     # (absent — PRD.md serves as entry point)
```

## Directory Notes

| Directory | Purpose |
|-----------|---------|
| `syntax/` | Tier-0 spec documents: authoring conventions and the `sem-note` element schema. This repo is spec-first — specs precede implementation. |
| `demo/` | Standalone browser demo of the Lit `SemNote` web component; served via `npm run serve`. |
| `cypress/` | End-to-end test suites exercising the demo/component behavior. |
| `docs/` | Maintained project docs (layout / schema / architecture). |

## Build Outputs (gitignored, not documented above)

- `dist/` — Vite library build output (declared in `package.json` `files`)
- `node_modules/` — dependencies
- Cypress artifacts (screenshots/videos) — generated at test time

## Commands

| Command | Action |
|---------|--------|
| `npm run build` | Vite library build → `dist/` |
| `npm test` | Cypress E2E run |
| `npm run serve` | Vite preview on port 4173 |
