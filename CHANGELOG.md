# CHANGELOG

## 2026-10-13

- feat(data-visualizer): phase 1 — `sem-data-visualizer` / `sem-data-source` (inline Markdown-table sources): column-schema inference (string/number/integer/boolean/date/null + nullable) exposed as `application/json` (`.sem-data-schema`), native-table render with per-column typed sort (`aria-sort` cycle, extraction-safe `data-sem-source-index` stamps), `data-views`/`data-view` parsing + default column selection (`hidden` keeps data in DOM), clear inline errors for non-table bodies and unbuilt formats. Design: `spec/data-visualizer.md` (phases 2-6 designed); schema defs in `spec/schema/semtext.schema.json`; vocabulary CSS `.sem-data-*`. Size budgets raised deliberately: reading 19.5→27 KB (measured 25.6), Lit 56→63 KB (measured 55.8) — ROADMAP "Size budgets". Unit tier: 72/72 passing (`test/unit/data-visualizer.test.ts`). Demo section in `web/demo/reading-lit.html` (#data-h) — `npm run build` needed before `npm run serve` shows it.
