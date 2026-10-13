# arch/bundles — the one-script surface

SemText ships **one script** and **stylesheets**, built by
`scripts/build.mjs`:

| Artifact | Global | Role |
|---|---|---|
| `dist/semtext.js` | `SemText` | The single Lit 3 IIFE. Defines the ten interactive custom elements (`src/lit/`), carries the vanilla handlers for everything no component defines (`src/fallback/`), the prose-reading renderers (`src/reading/`), the Markdown renderer (`src/md/`), and the extraction recipe (`src/extract/`, exposed as `SemText.extractRecords` / `SemText.extractText`). |
| `dist/semtext.css` | — | The vocabulary base (built from `themes/_vocabulary.css`): every `sem-*` element gets its box before any definition; all hide rules, gated on `[data-sem-upgraded]`. |
| `dist/themes/semtext-theme-<name>.css` | — | One file per theme, `--sem-*` tokens on `[data-sem-theme]` (built from `themes/<name>.css`). |

Until 2026-10 the vanilla tiers shipped as separate scripts
(`semtext-fallback.js`, `semtext-reading.js`, `semtext-md.js`,
`semtext-extract.js`) so a document could run without Lit. That split is
retired by decision (Lit-only surface, spec v0.6): one runtime, one
marker (`data-sem-upgraded`), one file to inline or link. The former
fallback code lives on inside the bundle — it still drives
`sem-views`, `sem-reveal`, `sem-progress`, audience gating, deep links
and the class-form alias; it just never ships alone. A document without
the script shows authored text only — not styled, not interactive
(spec/conventions.md §4).

## Size budget (minified, CI-enforced)

Recorded in `scripts/build.mjs`; the budget is enforced in CI via
`npm run build:strict` (an artifact over budget fails the `test` job — see
`.github/workflows/ci.yml`). Local runs print measured size and warn but do
not block.

| Artifact | Budget (KB minified) |
|---|---|
| `semtext.js` | 96 |

The bundle is the former five artifacts merged (analysis estimate ~89.5 KB
raw / ~30 KB gzip; measured size is printed on every build). Per-tier
budgets (fallback 14 / reading 19.5 / extract 12 / md 8.5) are retired
with their artifacts.

Budget changes are recorded in `ROADMAP.md`; change the table and the
ROADMAP entry together.

## Layering

1. **CSS** (`dist/semtext.css`, `dist/themes/semtext-theme-<name>.css`) —
   offline-safe component base; JS-off a document shows authored text only.
2. **`dist/semtext.js`** — everything interactive: Lit components, vanilla
   handlers, reading + Markdown renderers, extraction.

→ *Distribution forms and the `sem:inline` inliner: [build-deploy.md](build-deploy.md)*
