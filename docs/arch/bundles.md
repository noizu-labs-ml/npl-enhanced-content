# arch/bundles — the three-tier bundle architecture

SemText ships five independent classic (IIFE) scripts, built by
`scripts/build.mjs`. They are separate on purpose: the fallback tier must run
in a document that never loads Lit, so it cannot share a bundle with it. Each
tier adds capability; every tier accepts the same vocabulary (tag form
canonical, class form as Appendix A alias) and the same authored document.

| Bundle | Global | Tier | Role |
|---|---|---|---|
| `semtext-fallback.js` | `SemTextFallback` | fallback | The **contract tier**: vanilla JS, no Lit, full baseline interactivity (view-as switching, reveal, highlight occlusion, quiz checking, progress). Works JS-off by construction in the `.nojs.html` artifacts. |
| `semtext-reading.js` | `SemTextReading` | reading | Prose-reader chrome: reader shell, glossary popovers, references/backlinks, code actions, table sort/filter. Chrome only — mints no records. |
| `semtext.js` | `SemText` | full | Lit 3 custom-element upgrade (`src/lit/`, ten components); supersedes fallback in place. |
| `semtext-md.js` | `SemTextMd` | md | Renders `sem-md` Markdown sources. |
| `semtext-extract.js` | `SemTextExtract` | extract | Ships the record extraction recipe to page consumers. |

## Size budgets (minified, CI-enforced)

Recorded in `scripts/build.mjs`; budgets are enforced in CI via
`npm run build:strict` (a bundle over budget fails the `test` job — see
`.github/workflows/ci.yml`). Local runs print measured size and warn but do
not block.

| Bundle | Budget (KB minified) |
|---|---|
| `semtext.js` | 56 |
| `semtext-fallback.js` | 14 |
| `semtext-reading.js` | 19.5 |
| `semtext-extract.js` | 12 |
| `semtext-md.js` | 8.5 |

Budget changes are recorded in `ROADMAP.md`; change the table and the
ROADMAP entry together.

## Layering

1. **Theme + vocabulary CSS** (`themes/<name>.css`, `themes/_vocabulary.css`) —
   offline-safe component base, JS-off presentable.
2. **Fallback core** (+ reading/md bundles where the document needs them) —
   interactivity without Lit.
3. **`semtext.js`** — the optional Lit upgrade.

→ *Distribution forms and the `sem:inline` inliner: [build-deploy.md](build-deploy.md)*
