# Project Architecture — Summary

XHTML-first rich-content format for NPL: one document serves browser (styled/interactive), LLM (structural), terminal (text extraction). Spec-first repo — `syntax/` tier-0 specs govern code; Lit `SemNote` + demo + cypress currently ship.

## Components

- **Tier-0 specs** (`syntax/conventions.md` v0.4, `schema/sem-note.md`) — BDD source of truth; change order spec → spec → code → e2e.
- **Class-based vocabulary** — identity = `sem-*` classes, parameters = `data-*`; mechanical map to future custom elements.
- **`sem-fallback` handler** — inline ~2–4KB vanilla JS; full baseline interactivity with zero external resources.
- **Lit 3 components** — upgrade in place, light-DOM content, shadow-DOM chrome; handoff via `data-sem-fallback`.
- **Theme layer** — `data-sem-theme`, `--sem-*` tokens, 4 TRP-ported themes, zero-JS flips.
- **Demo + cypress** — reference impl (`demo/index.html`) validated by `cypress/e2e/sem-note.cy.js`.

## Rendering tiers

JS-off theme CSS → fallback JS → Lit upgrade; no layout shift; content always light DOM.

## Key decisions

- XHTML-first canonical; attributes canonical, inline notation is sugar; no preprocessing layer in v0.4.
- Distribution: folder / single-file / MHTML; no ES-module scripts, no runtime fetch in portable docs.
- Vocabulary = document-shaped XML variant of NPL; this repo publishes the schema file, NPL MCP consumes (Q4).
