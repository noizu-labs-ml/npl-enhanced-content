# Project Architecture — Summary

SemText (spec draft v0.5): XHTML-first semantic markup vocabulary — one
document, three readings (styled interactive page / structural record for
LLM agents / extracted plain text). Zero React; Lit components are thin
wrappers over a zero-JS fallback tier. Spec-first repo.

## Architecture

- **Bundle tiers** — five IIFE scripts layering over one document: fallback
  (contract tier, works JS-off), reading (prose chrome), full (Lit upgrade),
  md, extract. Minified size budgets CI-enforced via `build:strict`.
- **Extraction invariant** — `E(D) = E(R(D)) = E(I(R(D)))`; every interactive
  layer is chrome and mints nothing; enforced by e2e, contract in
  `spec/extraction.md` §5.
- **Vocabulary model** — tag form canonical (class form = Appendix A alias);
  dual-spelling selectors and `data-sem-fallback`/`data-sem-upgraded` tier
  markers gate styling per tier; JS-off tier is text-only via `attr()`.
- **Build & distribution** — `build.mjs` (bundles) + `build-standalone.mjs`
  (pages, `.nojs.html` variants, `sem:inline` version/size markers); folder
  and single-file portable forms.
- **Deployment** — single CI workflow: e2e + budget gate → image on `main` →
  CI-bot helm tag bump → ArgoCD auto-sync; CDN publish gated on a repo
  variable.

## Key decisions

- Bottom tier is the contract: zero-JS support forces semantics into the
  document itself.
- Tag form canonical: bare attributes, no `data-*`; XML-consumer-clean.
- Lit upgrades in place; light-DOM content; chrome mints nothing.
- XHTML over Markdown: the document is the data, no preprocessing layer.

Details: docs/arch/bundles.md · extraction.md · vocabulary.md ·
build-deploy.md · decisions.md
