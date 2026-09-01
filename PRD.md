# PRD — `npl-enhanced-content` · The XML Variant of NPL

v0.3 · 2026-09-01 · Status: DRAFT — npl- prefix, semantic naming, universal
fallback handler (v0.2 XHTML-first model retained; v0.1 was a false start)
Session: noizu-labs / noizu-infra `8a675934-4fd9-4899-8678-2137f051ae78`

---

## 1. Vision

`npl-enhanced-content` defines the **XML/HTML variant of NPL**: rich documents
whose canonical artifact is a **standalone XHTML file**. Element names are
**semantic** (`npl-fact`, `npl-detail`, `npl-procedure`), never
UI-descriptive; presentation is a parameter (`view-as="quiz|flashcards|list"`),
not the identity. One file, three consumers:

| Consumer | Experience |
| :-- | :-- |
| **Human, browser** | Double-click the `.html`/`.mhtml` — current Chrome/Edge/Brave/Firefox/Safari render styled, interactive documents. No server, no build, no install. |
| **LLM / non-visual** | The same file read as XHTML: heavy semantic attributes qualify every piece of data. The markup IS the machine contract — and the same XML vocabulary the NPL MCP server already speaks. |
| **Terminal user** | Browser render or DOM-text extraction; content complete without JS. |

NPL conventions live **inside the tags** — attributes, `::` pairs,
`[[cloze]]`, `[hint|reveal]` — never as a pre-HTML grammar.

## 2. Goals / Non-Goals

**Goals**

- `<npl-enhanced-document>` root element; document-level metadata (e.g.
  `<agent><name/><bio/><instructions/></agent>`) as semantic XML children.
- Lit 3 web components; **zero React** in the dependency tree.
- **Universal inline fallback handler** (load-bearing, §7): a tiny always-
  embedded vanilla-JS snippet gives every document baseline interactivity even
  when the Lit bundle/CDN is unreachable. Lit upgrades when available.
- Theme system ported from TRP (YAML tokens → compiled CSS, `--npl-*` tokens).
- Cypress BDD specs co-authored with each element schema before code.

**Non-Goals (v1)**

- Markdown (or any non-HTML) as canonical source; an md→npl authoring aid is
  optional Tier 2, never required.
- WYSIWYG editor; SSR; React wrappers.

## 3. Source-Material Audit

| Asset | In TRP | Disposition |
| :-- | :-- | :-- |
| Theme system | YAML → generated CSS, `html[data-design-theme]` | **Lift**; rename `--npl-*`, `data-npl-theme` |
| `trp-item-timeline` | Only real Lit component | **Lift packaging pattern**; port as `npl-chronology` (Tier 2) |
| Quiz question types | `components/22-quiz-question-types.md` — 7 renderers | **Feature spec** for `view-as="quiz"` |
| Flashcard spec | `components/13-flashcard.md` — cloze/flip/swipe | **Feature spec** for `npl-fact`/`npl-detail` views |
| Prior v0.1/v0.2 drafts | `hui-*` catalog | Element purposes survive; names now semantic `npl-*` |

## 4. Format Specification (v0)

```html
<!doctype html>
<html lang="en" data-npl-theme="minimal-tech-light">
<head>
  <meta charset="utf-8">
  <title>Authoring Guide</title>
  <link rel="stylesheet" href="npl/themes/minimal-tech-light.css">
  <script id="npl-fallback">/* always-embedded vanilla handler, §7 */</script>
  <script defer src="npl/npl.js"></script>   <!-- Lit upgrade, optional -->
</head>
<body>
<npl-enhanced-document>
  <agent>
    <name>Infra Guide</name>
    <bio>Deployment runbook assistant for the trl-infra fleet</bio>
    <instructions>Answer from document facts only; cite npl-fact ids.</instructions>
  </agent>

  <npl-facts view-as="flashcards" controls="shuffle">
    <npl-fact id="f-jwt">
      <statement>JWTs rotate per session</statement>
      <conclusion>Short-lived access tokens; refresh grants a new pair.</conclusion>
    </npl-fact>
  </npl-facts>

  <npl-details view-as="quiz">
    <npl-detail>
      The OIDC token travels in the <highlight>Authorization</highlight> header.
    </npl-detail>
  </npl-details>
</npl-enhanced-document>
</body>
</html>
```

Binding rules:

1. **Semantic identity, parameterized presentation.** `<npl-fact>` is a fact
   whether viewed as list, flashcard, or quiz — `view-as` selects rendering.
2. **Machines read the XML.** Children like `<statement>`/`<conclusion>` are
   named roles; attributes (`kind`, `status`, `tags`) qualify. Same vocabulary
   is the XML variant NPL's MCP server already handles.
3. **`<highlight>` is the universal cloze**: in quiz/flashcard views its
   content occludes (recall target); in plain reading it renders emphasized.
4. Pre-upgrade styling via `:not(:defined)`; degradation always readable.
5. Light DOM for content; shadow DOM for interactive chrome only.

## 5. Element Catalog (semantic names)

Schema + BDD spec land together, before code (§8). Tier order simplest first.

### Tier 0

| Element | Children/attrs | Purpose |
| :-- | :-- | :-- |
| `npl-note` | `variant="info\|warning\|tip\|danger"`, `collapsed` | callout annotation |
| `npl-fact` | `<statement>` + `<conclusion>`; standalone or in `npl-facts` | assertable Q/A pair — the atomic unit |
| `npl-facts` | `view-as="list\|flashcards\|quiz"`, `controls` | fact collection; the flagship surface |
| `npl-detail` / `npl-details` | `<highlight>` cloze spans; `view-as` | prose passage with occludable content |
| `npl-procedure` / `npl-step` | `status="done\|current\|todo\|blocked"` | ordered procedure |
| `npl-properties` / `npl-property` | `key` attr | definition/properties block → `<dl>` |
| `npl-views` / `npl-view` | `name` | same content, switchable perspectives (tabs family — ❓ naming) |
| `npl-reveal` | `summary` attr | reveal-on-demand content |
| `npl-progress` | `value`, `label` | completion/meter role |

### Tier 1 — flagship buildout

- `npl-facts` full: filter/tag chips (list), flip+swipe+shuffle (flashcards),
  quiz candidates from explicit `<npl-distractor>` children else sibling
  statements; `hui-complete`-style events → `npl-complete {correct,total,ms}`.
- `npl-details` full: `<highlight>` occlusion in quiz view; sequencing.
- `<npl-question type="mc|multi|blank|match|order|tf|short">` — the 7 TRP
  renderers as quiz content inside `npl-facts view-as="quiz"`; `<npl-option
  correct>` children; `✅/✗` glyph sugar; scoring + `retry` control.

### Tier 2

- `npl-chronology` / `npl-event when` — TRP timeline port.
- `npl-table`, `npl-query` — data surfaces over inline JSON payload scripts.
- `npl-themes controls="picker"` — floating theme switcher.
- md→npl authoring aid (optional, never required).

## 6. Theme System

- `data-npl-theme="<slug>"` on `<html>`; themes compiled from TRP-format YAML
  → `npl/themes/<slug>.css`; `--npl-*` tokens; `:not(:defined)` vocabulary base
  included so docs are presentable pre-upgrade and JS-off.
- Shadow components read tokens via fallback indirection; zero-JS theme flips.
- Ship 4 TRP ports: `minimal-tech-light` (default), `nocturne-console`,
  `organic-warm`, `editorial-settings`; auto light/dark via
  `prefers-color-scheme`, `data-color-mode` forces.

## 7. Universal inline fallback handler (load-bearing)

Every portable document embeds, inline in `<head>`:

```html
<script id="npl-fallback">/* ~2-4KB vanilla JS: view-as switching,
  reveal toggles, highlight occlusion, basic quiz checking */</script>
```

- Guarantees a **fully interactive document with zero external resources** —
  CDN unreachable, `npl.js` missing, offline MHTML: the doc still works.
- `npl/npl.js` (Lit 3, IIFE classic script) upgrades elements in place when
  reachable; fallback behaviors yield to component implementations.
- BDD asserts both tiers per element: fallback-only green + upgraded green.

## 8. Distribution & the file:// constraint

ES modules are CORS-blocked over `file://` ⇒ IIFE classic scripts only, no
runtime fetch; data via inline JSON payload scripts or attributes. Forms:
(a) folder form (`doc.html` + relative `npl/`), (b) single-file inlined,
(c) MHTML bundle. Each element's BDD suite includes a file:// smoke spec.

## 9. BDD Process (binding)

1. `syntax/schema/<element>.md` — semantic contract: children, attrs, view-as
   modes, events, a11y, machine-annotation contract.
2. `cypress/e2e/<element>.cy.js` — render, fallback-only, upgraded, JS-off,
   file:// smoke, a11y roles.
3. Implement until green; next element only then.
4. Syntax red/green: if a spec can't be written concisely, fix the vocabulary.

## 10. Repo Layout & Roadmap

```
npl-enhanced-content/
├── PRD.md
├── syntax/{conventions.md,schema/}
├── src/{elements/,themes/build.ts,index.ts}
├── themes/ · demo/ · cypress/e2e/
└── package.json (lit ^3, vite, typescript, cypress)
```

Local repo `Portfolio/AI/npl-enhanced-content`; promotion via `make-repo` →
`the-robot-lives/npl-enhanced-content` → monorepo submodule.

| Milestone | Content | Exit |
| :-- | :-- | :-- |
| M1 | Format spec v0 + Tier-0 schemas + red BDD specs (fallback + upgraded) | 9 schemas, 9 red specs |
| M2 | **v0.4 class-based baseline shipped** (`demo/index.html`: inline CSS + Tailwind CDN + fallback handler); Lit upgrade deferred to M3+ | demo opens via double-click; flashcards/quiz/highlight work with zero external resources beyond Tailwind CDN |
| M3 | `npl-facts`/`npl-details` flagship (list/flashcards/quiz) | demo + green, single-file variant builds |
| M4 | `npl-question` 7 types; highlight occlusion full | TRP parity |
| M5 | Tier 2 + MHTML + npm publish prep | zero React; mhtml round-trip |

## meta-review

```
(like)    Semantic identity / parameterized presentation — view-as on npl-facts is the key inversion
(like)    Fallback handler makes "standalone" honest: works with all externals stripped
(dislike) Fallback + Lit dual implementation per element doubles behavior surface — BDD must pin exact handoff
(dislike) Bare <agent> children vs npl-prefixed: XML validation story needs one decision, documented
```
