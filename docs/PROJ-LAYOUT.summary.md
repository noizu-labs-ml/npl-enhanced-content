# Project Layout — Summary

```
npl-enhanced-content/
├── syntax/                       # Canonical specs (conventions.md/.html, schema/npl-note.md)
├── demo/                         # Standalone Lit NplNote demo (index.html)
├── cypress/                      # E2E tests (e2e/npl-note.cy.js)
├── docs/                         # PROJ-ARCH / PROJ-LAYOUT / PROJ-SCHEMA
├── cypress.config.js
├── vite.config.ts
├── tsconfig.json
├── package.json
├── PRD.md
└── CLAUDE.md
```

Spec-first repo: `syntax/` holds tier-0 spec docs; demo + cypress validate the Lit component.
