# npl-enhanced-content — Format Spec & Conventions

**DRAFT v0.4 — class-based baseline.** v0.4 renders the vocabulary as
**classes on plain elements** (`<div class="npl-agent">`), not custom
elements: inline core CSS + Tailwind CDN refinement (`@apply` on `npl-*`
classes) + the vanilla fallback handler. Reference implementation:
`demo/index.html`. Semantic custom elements (`<npl-fact>`) remain the target
vocabulary for the Lit milestone; the class mapping below is mechanical.

**v0.4 mapping** — identity = class, parameters = `data-*` attrs:

| v0.3 element | v0.4 class markup |
| :-- | :-- |
| `<npl-enhanced-document>` | `div.npl-enhanced-document` |
| `<agent>` + name/bio/instructions | `div.npl-agent` › `.npl-agent-name/-bio/-instructions` |
| `<npl-note variant="warning">` | `div.npl-note[data-variant="warning"]`, body `.npl-note-body`, `collapsed` attr |
| `<npl-facts view-as="quiz">` | `div.npl-facts[data-view-as="quiz"]` |
| `<npl-fact>` / statement / conclusion | `div.npl-fact` › `.npl-statement`, `.npl-conclusion` |
| `<npl-distractor>` | `div.npl-distractor` |
| `<npl-details>` / `<npl-detail>` | `div.npl-details` › `div.npl-detail` |
| `<highlight>` | `span.npl-highlight` (occluded form: `.npl-occluded`) |

CSS layering (all inline in `<head>`): (1) plain core CSS — theme tokens on
`[data-npl-theme]` + component base, offline-safe; (2) `<style
type="text/tailwindcss">` with `@apply` rules per class — refinement, no-op
without the CDN script; (3) `npl-fallback` vanilla JS — interactivity.
Supersedes v0.3 custom-element examples until the Lit milestone.
`❓` = open questions (§10).

---

## Outline

0. [Model](#0-model)
1. [Document skeleton](#1-document-skeleton)
2. [Attribute catalog](#2-attribute-catalog)
3. [NPL notation inside tags](#3-npl-notation-inside-tags)
4. [Fallback handler & degradation rules](#4-fallback-handler--degradation-rules)
5. [Element entries](#5-element-entries)
6. [Theme conventions](#6-theme-conventions)
7. [Distribution forms](#7-distribution-forms)
8. [Machine-readability contract](#8-machine-readability-contract)
9. [NPL XML-variant alignment](#9-npl-xml-variant-alignment)
10. [Open questions](#10-open-questions)

---

## 0. Model

One file, three consumers — human/browser (double-click, styled, interactive),
LLM/non-visual (the same XHTML read structurally; attributes qualify every
datum; same XML vocabulary NPL's MCP server already speaks), terminal (browser
or DOM-text extraction). Element names are **semantic** (`npl-fact`,
`npl-detail`) — what content *is*; presentation is parameterized
(`view-as="quiz|flashcards|list"`) — how it *renders*. NPL conventions live
inside the tags, never as a pre-HTML grammar.

## 1. Document skeleton

```html
<!doctype html>
<html lang="en" data-npl-theme="minimal-tech-light">
<head>
  <meta charset="utf-8">
  <title>Authoring Guide</title>
  <link rel="stylesheet" href="npl/themes/minimal-tech-light.css">
  <script id="npl-fallback">/* always-embedded vanilla handler (§4) */</script>
  <script defer src="npl/npl.js"></script>  <!-- Lit upgrade, optional -->
</head>
<body>
<npl-enhanced-document>

  <!-- document-level metadata: bare semantic children -->
  <agent>
    <name>Infra Guide</name>
    <bio>Deployment runbook assistant</bio>
    <instructions>Answer from npl-fact ids only.</instructions>
  </agent>

  <h1 data-kind="title">Authoring Guide</h1>

  <!-- content: npl-* vocabulary + ordinary semantic HTML -->

</npl-enhanced-document>
</body>
</html>
```

- `<npl-enhanced-document>` is the required root wrapper (fallback handler
  scopes to it; Lit components register against it).
- Metadata children (`agent`, and future `org`, `context`, `audience`) are
  **bare semantic tags** — machine-facing, unstyled. ❓ **Q1** keep bare vs
  `npl-`-prefix them?
- Ordinary semantic HTML is always valid content; `npl-*` enhances where
  interactivity pays.

## 2. Attribute catalog

Global attributes (any `npl-*` element):

| Attribute | Values | Machine meaning |
| :-- | :-- | :-- |
| `kind` | free token (`concept`, `anti-pattern`, `caveat`, …) | what the data IS |
| `tags` | comma list | classification |
| `view-as` | element-defined modes | presentation parameter (identity unchanged) |
| `status` | `done`, `current`, `todo`, `blocked`, `pass`, `fail` | lifecycle/verdict |
| `controls` | comma flags: `shuffle`, `filter`, `retry`, `picker` | which controls render |
| `collapsed` | boolean | pre-collapse state |
| `id` | doc-unique | stable anchor, cite target |
| `data-*` | free | extension point |

`view-as` is the core inversion: `<npl-fact>` is a fact in every view;
`view-as` only selects rendering. Unknown `view-as` ⇒ falls back to `list`/
plain + fallback-handler warning.

## 3. NPL notation inside tags

Compact notation is legal inside element text where the schema allows;
**attributes are canonical, notation is sugar**:

| Notation | Meaning | Where |
| :-- | :-- | :-- |
| `<highlight>` | recall target — occludes in quiz/flashcard views, `<em>` in plain view | any prose element |
| `[[cloze]]` | inline occlusion sugar (equivalent to `<highlight>`) | `npl-detail`, `npl-fact` |
| `term :: value` | pair | `npl-property` text, `npl-fact` compact form |
| `✅ …` / `✗ …` | correct / distractor | `npl-option` sugar |
| `→ …` | current | `npl-step` status sugar |
| `[hint \| reveal]` | agent-facing instruction, human-rendered hint | instruction-bearing elements (define in `npl-note` schema first) |

`<statement>`/`<conclusion>` children always win over `::` compact form when
both present; authors pick one per fact.

## 4. Fallback handler & degradation rules

1. `<script id="npl-fallback">` is embedded inline in every portable doc
   (~2–4KB vanilla JS): `view-as` switching, reveal toggles, `<highlight>`
   occlusion, basic quiz checking, theme picker. **Zero external resources
   required for full baseline interactivity.**
2. `npl/npl.js` (Lit 3, IIFE) upgrades elements in place when reachable;
   component implementations supersede fallback behaviors. Handoff contract:
   fallback sets `data-npl-fallback` on elements it enhanced; components
   remove it on upgrade. BDD asserts both tiers + the handoff.
3. Theme CSS styles the vocabulary via `npl-*:not(:defined)` — presentable
   JS-off; no layout shift on upgrade where feasible.
4. Content lives in light DOM (searchable, copyable); shadow DOM carries
   interactive chrome only.

## 5. Element entries (rough)

### Tier 0

**npl-note** — callout.
```html
<npl-note variant="warning">Rotation is <strong>per session</strong>.</npl-note>
```
`variant="info|warning|tip|danger"`; `collapsed` ⇒ native `<details>`.
Light DOM, `role="note"`. *(schema + spec exist — rename + re-attr done.)*

**npl-fact** — the atomic unit; assertable Q/A pair.
```html
<npl-fact id="f-jwt" kind="concept">
  <statement>JWTs rotate per session</statement>
  <conclusion>Short-lived access; refresh grants a new pair.</conclusion>
</npl-fact>
```
Compact form: `<npl-fact>JWT rotation :: short-lived access</npl-fact>`.
Machine view: statement+conclusion = structured assertion.

**npl-facts** — collection; the flagship surface.
```html
<npl-facts view-as="quiz" controls="shuffle,filter">
  <npl-fact>…</npl-fact>
  <npl-fact>…<npl-distractor>decoy conclusion</npl-distractor></npl-fact>
</npl-facts>
```
- `view-as="list"` (default): filter box, tag chips.
- `view-as="flashcards"`: front = statement (+`<highlight>` prompt), back =
  conclusion; flip click/Space; ←/→/swipe; progress `3/12`; `shuffle`.
- `view-as="quiz"`: statement shown; candidates = sibling conclusions,
  `<npl-distractor>` children win when present; accuracy on `npl-complete`.
- Events: `npl-navigate {index}`, `npl-flip {face}`, `npl-complete {correct,total,ms}`.

**npl-detail / npl-details** — prose with occludable content.
```html
<npl-details view-as="quiz">
  <npl-detail>
    The OIDC token travels in the <highlight>Authorization</highlight> header.
  </npl-detail>
</npl-details>
```
Plain view: `<highlight>` renders `<em>`. Quiz view: occluded (`▮▮▮`), reveal
per item, self-check or auto-check.

**npl-procedure / npl-step** —
```html
<npl-procedure kind="runbook">
  <npl-step status="done">provision Infisical path</npl-step>
  <npl-step status="current">port-forward MinIO</npl-step>
  <npl-step>run migrations</npl-step>
</npl-procedure>
```
`<ol>` + `data-status`; `status` attr canonical, `✅/→/❌` prefix sugar.

**npl-properties / npl-property** —
```html
<npl-properties kind="config">
  <npl-property key="token ttl">15m</npl-property>
</npl-properties>
```
Renders `<dl>`; no JS v1. ❓ **Q2** add copy/search chrome later?

**npl-views / npl-view** — switchable perspectives (tabs family).
```html
<npl-views id="deploy">
  <npl-view name="Helm">content…</npl-view>
  <npl-view name="ArgoCD">content…</npl-view>
</npl-views>
```
Deep-link `#deploy/argocd`; arrow-key nav; `role="tablist"` contract.
❓ **Q3** `npl-views` the right semantic name? alternatives: `npl-perspectives`.

**npl-reveal** — `<details>`-backed; `summary` attr or first line.
**npl-progress** — `<npl-progress value="0.62" label="coverage">`; `role="meter"`.

### Tier 1 — flagship buildout

- `npl-facts` full build (filter, shuffle, swipe, quiz scoring).
- `npl-question` — 7 TRP renderers inside quiz views:
```html
<npl-question type="mc">
  <p data-kind="prompt">Which header carries the OIDC token?</p>
  <npl-option correct>Authorization</npl-option>
  <npl-option>Cookie</npl-option>
</npl-question>
```
Types `mc|multi|blank|match|order|tf|short`; `correct` attr canonical,
`✅` sugar; `retry` control; results block; machine view = assertable Q/A.

### Tier 2

- `npl-chronology` / `npl-event when` — TRP timeline port.
- `npl-table`, `npl-query` — data over inline `<script type="application/json">`
  payloads (portable; no fetch).
- `npl-themes controls="picker"` — floating switcher.
- md→npl authoring aid (optional, never required).

## 6. Theme conventions

- `data-npl-theme="<slug>"` on `<html>`; one theme per doc; themes compiled
  from TRP-format YAML → `npl/themes/<slug>.css`; `--npl-*` tokens;
  `:not(:defined)` vocabulary base included.
- Shadow components read tokens via fallback indirection — zero-JS theme flips.
- Ship 4 TRP ports: `minimal-tech-light` (default), `nocturne-console`,
  `organic-warm`, `editorial-settings`; auto light/dark via
  `prefers-color-scheme`, `data-color-mode` forces.

## 7. Distribution forms

1. **Folder** — `doc.html` + relative `npl/` (IIFE `npl.js` + `themes/`).
2. **Single-file** — fallback + CSS + Lit bundle + data all inlined; one file
   shares anywhere.
3. **MHTML** — multi-page bundle.
4. Hard rules: no ES-module scripts; no runtime fetch in portable docs;
   the fallback handler is always embedded regardless of form.

## 8. Machine-readability contract

- Semantic children (`<statement>`, `<conclusion>`, `<highlight>`) + attrs
  (`kind`, `status`, `tags`, `view-as`) qualify every datum.
- Well-formed, correctly nested HTML — parseable by XML/HTML tooling; the same
  vocabulary is the XML variant of NPL (§9).
- Events + attrs documented per schema = agent integration surface.
- "Text extraction" reference recipe (DOM → annotated plain text) ships with
  the lib for terminal/LLM pipelines.

## 9. NPL XML-variant alignment

This vocabulary is the **XML variant of NPL**: NPL yaml already models agents
(name/bio/instructions), instructions, and structured prompt sections via the
MCP server; this format is its document-shaped rendering target. Alignment
tasks (tracked, not blocking M1): map `<agent>` children to NPL agent schema;
map `npl-fact` to NPL fact/knowledge records; define `npl-enhanced-document`
as a valid MCP `NPLLoad`/render target. ❓ **Q4** who owns the mapping — this
repo exports it, or NPL MCP consumes a schema file we publish?

## 10. Open questions

| # | Question | My lean |
| :-- | :-- | :-- |
| Q1 | bare `<agent>` metadata children vs `npl-`-prefixed | bare (per your example; matches NPL yaml shape) |
| Q2 | `npl-properties` pure `<dl>` v1 | yes, chrome later |
| Q3 | tabs-family name: `npl-views` vs `npl-perspectives` | `npl-views` (shorter; `name` attr reads well) |
| Q4 | NPL MCP alignment ownership | we publish the schema file; MCP consumes |
| Q5 | fallback handler scope: baseline interactivity only vs full quiz logic | full logic v1 — it's small and makes single-file form Lit-free |
