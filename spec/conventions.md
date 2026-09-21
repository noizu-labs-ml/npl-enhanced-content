# SemText — Format Spec & Conventions

**DRAFT v0.4 — class-based baseline.** v0.4 renders the vocabulary as
**classes on plain elements** (`<div class="sem-agent">`), not custom
elements: inline core CSS + Tailwind CDN refinement (`@apply` on `sem-*`
classes) + the vanilla fallback handler. Reference implementation:
`web/demo/index.html`. Semantic custom elements (`<sem-fact>`) remain the target
vocabulary for the Lit milestone; the class mapping below is mechanical.

**v0.4 mapping** — identity = class, parameters = `data-*` attrs:

| v0.3 element | v0.4 class markup |
| :-- | :-- |
| `<sem-enhanced-document>` | `div.sem-enhanced-document` |
| `<agent>` + name/bio/instructions | `div.sem-agent` › `.sem-agent-name/-bio/-instructions` |
| `<sem-note variant="warning">` | `div.sem-note[data-variant="warning"]`, body `.sem-note-body`, `collapsed` attr |
| `<sem-facts view-as="quiz">` | `div.sem-facts[data-view-as="quiz"]` |
| `<sem-fact>` / statement / conclusion | `div.sem-fact` › `.sem-statement`, `.sem-conclusion` |
| `<sem-distractor>` | `div.sem-distractor` |
| `<sem-details>` / `<sem-detail>` | `div.sem-details` › `div.sem-detail` |
| `<highlight>` | `span.sem-highlight` (occluded form: `.sem-occluded`) |
| `<sem-procedure>` / `<sem-step status>` | `div.sem-procedure` › `div.sem-step[data-status]` |
| `<sem-properties>` / `<sem-property key>` | `div.sem-properties` › `div.sem-property[data-key]` |
| `<sem-views>` / `<sem-view name>` | `div.sem-views[id]` › `div.sem-view[data-name]`, `data-active` marker |
| `<sem-reveal summary>` | `div.sem-reveal[data-summary]`, `collapsed` attr |
| `<sem-progress value label>` | `div.sem-progress[data-value][data-label]` |
| `<sem-chronology view-as>` / `<sem-event when until status>` | `div.sem-chronology[data-view-as]` › `div.sem-event[data-when][data-until][data-status]` (+ `<time datetime>`) |
| `<sem-code lang filename mark wrap controls>` › `<pre><code>` | `div.sem-code[data-lang][data-filename][data-mark][data-controls]` › `<pre><code>` |
| `<sem-references kind>` / `<sem-reference id href cite>` | `div.sem-references[data-kind]` › `div.sem-reference[id][data-href][data-cite]`; citations are plain `<a href="#id">` |
| `<sem-properties view-as="glossary">` | `div.sem-properties[data-view-as="glossary"]` › `div.sem-property[id][data-key]`; term anchors `<a href="#id">`, `<dfn>` optional |
| `<sem-source label view-as="html\|source">` › any content | `div.sem-source[data-label][data-view-as]` › any content; transparent wrapper, mints nothing |
| `<sem-reader controls outline-depth>` › optional `<nav aria-label="Contents">` | `div.sem-reader[data-controls][data-outline-depth]` › same optional nav; chrome, mints nothing |
| `<sem-md label view-as="rendered\|raw" controls>` › Markdown text | `div.sem-md[data-label][data-view-as][data-controls]` › Markdown text; `data-view-as` is runtime-mutable presentation |
| `<sem-table controls sticky>` › `<table>` | `div.sem-table[data-controls][data-sticky]` › authored `<table>` (`<th scope="col">`, `td[data-value]` sort keys) |

CSS and script layering, in both distribution forms (§7): (1) the theme
file — `--sem-*` tokens on `[data-sem-theme]` — and `themes/_vocabulary.css`
— the component base, offline-safe; (2) the `sem-fallback` vanilla handler
and, where the document needs them, the reading and Markdown bundles —
interactivity; (3) `semtext.js` — the optional Lit upgrade. The
**single-file** form inlines all of it in `<head>` (the build's `sem:inline`
markers); the **folder** form links the same files by relative path. Neither
form carries page-local CSS or JS beyond a small layout layer. The
Tailwind-refinement layer of the v0.3 demos is retired. Supersedes v0.3
custom-element examples until the Lit milestone. `❓` = open questions
(§10).

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
or DOM-text extraction). Element names are **semantic** (`sem-fact`,
`sem-detail`) — what content *is*; presentation is parameterized
(`view-as="quiz|flashcards|list"`) — how it *renders*. NPL conventions live
inside the tags, never as a pre-HTML grammar.

## 1. Document skeleton

```html
<!doctype html>
<html lang="en" data-sem-theme="minimal-tech-light">
<head>
  <meta charset="utf-8">
  <title>Authoring Guide</title>
  <link rel="stylesheet" href="semtext/themes/minimal-tech-light.css">
  <script id="sem-fallback">/* always-embedded vanilla handler (§4) */</script>
  <script defer src="semtext/semtext.js"></script>  <!-- Lit upgrade, optional -->
</head>
<body>
<sem-enhanced-document>

  <!-- document-level metadata: bare semantic children -->
  <agent>
    <name>Infra Guide</name>
    <bio>Deployment runbook assistant</bio>
    <instructions>Answer from sem-fact ids only.</instructions>
  </agent>

  <h1 data-kind="title">Authoring Guide</h1>

  <!-- content: sem-* vocabulary + ordinary semantic HTML -->

</sem-enhanced-document>
</body>
</html>
```

- `<sem-enhanced-document>` is the required root wrapper (fallback handler
  scopes to it; Lit components register against it).
- Metadata children (`agent`, and future `org`, `context`, `audience`) are
  **bare semantic tags** — machine-facing, unstyled. ❓ **Q1** keep bare vs
  `sem-`-prefix them?
- Ordinary semantic HTML is always valid content; `sem-*` enhances where
  interactivity pays.

## 2. Attribute catalog

Global attributes (any `sem-*` element):

| Attribute | Values | Machine meaning |
| :-- | :-- | :-- |
| `kind` | free token (`concept`, `anti-pattern`, `caveat`, …) | what the data IS |
| `tags` | comma list | classification |
| `view-as` | element-defined modes | presentation parameter (identity unchanged) |
| `status` | `done`, `current`, `todo`, `blocked`, `pass`, `fail` | lifecycle/verdict |
| `controls` | comma flags: `shuffle`, `filter`, `retry`, `picker` | which controls render |
| `collapsed` | boolean | pre-collapse state |
| `audience` | profile spec: `a`, `a, b`, `!a` (profiles from `sem-audiences`) | who the datum is for — **`spec/schema/sem-audiences.md`**; carried verbatim by extraction, never suppresses a record |
| `id` | doc-unique | stable anchor, cite target — a `#id` or `#container/child` hash reaches it through any closed reveal, collapsed note, inactive view or non-current card (fallback `target`) |
| `data-*` | free | extension point |

`view-as` is the core inversion: `<sem-fact>` is a fact in every view;
`view-as` only selects rendering. Unknown `view-as` ⇒ falls back to `list`/
plain + fallback-handler warning. CSS-only modes exist too:
`sem-note view-as="margin"` (right-gutter aside on wide viewports),
`sem-chronology view-as="timeline|list"`. `sem-properties
view-as="glossary"` adds term previews from the reading bundle.

**Hash state.** The hash is `&`-joined segments (`src/shared/state.ts`):
bare `id` / `container/child` deep links, and `name=value` parameters
(`sem-audience=<profile>`). Every writer edits its own segment only, so
`#deploy/argocd&sem-audience=operator` survives a tab switch.

**Class namespace.** Each element owns exactly the class namespace
`.sem-<element>` and `.sem-<element>-*`; no other element may reuse that
bare class name for its own chrome. `.sem-progress` names only the progress
element — a facts-chrome label needing similar styling is `.sem-facts-meter`,
never `.sem-progress` borrowed from another element.

## 3. NPL notation inside tags

Compact notation is legal inside element text where the schema allows;
**attributes are canonical, notation is sugar**:

| Notation | Meaning | Where |
| :-- | :-- | :-- |
| `<highlight>` | recall target — occludes in quiz/flashcard views, `<em>` in plain view | any prose element |
| `[[cloze]]` | inline occlusion sugar (equivalent to `<highlight>`) | `sem-detail`, `sem-fact` |
| `term :: value` | pair | `sem-property` text, `sem-fact` compact form |
| `✅ …` / `✗ …` | correct / distractor | `sem-option` sugar |
| `→ …` | current | `sem-step` status sugar |
| `[hint \| reveal]` | agent-facing instruction, human-rendered hint | instruction-bearing elements (define in `sem-note` schema first) |

`<statement>`/`<conclusion>` children always win over `::` compact form when
both present; authors pick one per fact.

## 4. Fallback handler & degradation rules

1. `<script id="sem-fallback">` is embedded inline in every portable doc
   (`dist/semtext-fallback.js`, ≤12 KB raw): `view-as` switching, reveal
   toggles, `<highlight>` occlusion, basic quiz checking, audience gating,
   deep-link resolution, print disclosure. **Zero external resources
   required for full baseline interactivity.** Prose-reading behaviours
   (sem-code chrome, reference / glossary previews, backlinks, and from
   R/W2 the `sem-reader` chrome and `sem-table` sort / filter) ship in a
   second vanilla script, `dist/semtext-reading.js` (≤17 KB raw, marker
   `<!-- sem:inline reading -->`), under the same rules; it marks what it
   wired with `data-sem-fallback` and skips elements a Lit wrapper already
   upgraded. Documents without those elements need not carry it. The
   core's first handler snapshots every `sem-source` wrapper's markup
   (a DOM clone in an inert `template.sem-source-raw` child) before
   any other handler runs; the reading bundle renders that copy. The
   `sem-md` renderer is a third vanilla script, `dist/semtext-md.js` (≤8 KB
   raw, marker `<!-- sem:inline md -->`, global `SemTextMd`), under the
   same rules; a document with no Markdown need not carry it.
2. `semtext/semtext.js` (Lit 3, IIFE) upgrades elements in place when reachable;
   component implementations supersede fallback behaviors. Handoff contract:
   fallback sets `data-sem-fallback` on elements it enhanced; components
   remove it on upgrade and set `data-sem-upgraded`. Both tiers also stamp
   their marker on `<html>` once they have run, for hide rules whose host
   element is deliberately unmarked (a list-view deck's distractors). BDD
   asserts both tiers + the handoff.
3. Theme CSS styles **both authoring forms from one rule** —
   `:is(sem-x, .sem-x)` throughout `themes/_vocabulary.css` (D10) — so an
   element-form document is presentable before and without the upgrade,
   with no layout shift on upgrade where feasible.
4. **Every hide rule is gated** on `:is([data-sem-fallback],
   [data-sem-upgraded])` (D12). With no script in the page nothing is
   hidden: distractors render labelled, views stack under their names,
   collapsed bodies and every conclusion show, audience-qualified content
   is all visible. `dist/demo/*.nojs.html` is the artifact that proves it.
5. Content lives in light DOM (searchable, copyable); shadow DOM carries
   interactive chrome only.
6. Cross-cutting, also in the vocabulary CSS: `@media print` shows
   everything a reader could open and no chrome (`beforeprint` opens reveal
   disclosures; CSS cannot); `prefers-reduced-motion` drops transitions and
   smooth scrolling.

## 5. Element entries (rough)

### Tier 0

**sem-note** — callout.
```html
<sem-note variant="warning">Rotation is <strong>per session</strong>.</sem-note>
```
`variant="info|warning|tip|danger"`; `collapsed` ⇒ native `<details>`;
`view-as="margin"` ⇒ CSS-only right-gutter aside on wide viewports, inline
otherwise. Light DOM, `role="note"`. *(schema + spec exist.)*

**sem-audiences / sem-profile** — reader profiles; metadata, mints nothing.
**Normative: `spec/schema/sem-audiences.md`.**
```html
<div class="sem-audiences">
  <div class="sem-profile" id="reader" data-label="Reader"></div>
  <div class="sem-profile" id="operator" data-implies="reader"></div>
</div>
<div class="sem-note" data-audience="operator">…</div>
```
Active profile = hash `sem-audience` param, else `data-audience` on the
root wrapper / `<html>`. Fallback sets native `hidden` on non-matching
elements; JS-off everything shows; fail-open on unknown tokens.

**sem-fact** — the atomic unit; assertable Q/A pair.
```html
<sem-fact id="f-jwt" kind="concept">
  <statement>JWTs rotate per session</statement>
  <conclusion>Short-lived access; refresh grants a new pair.</conclusion>
</sem-fact>
```
Compact form: `<sem-fact>JWT rotation :: short-lived access</sem-fact>`.
Machine view: statement+conclusion = structured assertion.

**sem-facts** — collection; the flagship surface.
**Normative: `spec/schema/sem-facts.md`.**
```html
<sem-facts view-as="quiz" controls="shuffle,filter">
  <sem-fact>…</sem-fact>
  <sem-fact>…<sem-distractor>decoy conclusion</sem-distractor></sem-fact>
</sem-facts>
```
- `view-as="list"` (default): filter box, tag chips.
- `view-as="flashcards"`: front = statement (+`<highlight>` prompt), back =
  conclusion; flip click/Space; ←/→/swipe; progress `3/12`; `shuffle`.
- `view-as="quiz"`: statement shown; candidates = sibling conclusions,
  `<sem-distractor>` children win when present; accuracy on `sem-complete`.
- Events: `sem-navigate {index}`, `sem-flip {face}`, `sem-complete {correct,total,ms}`.

**sem-detail / sem-details** — prose with occludable content.
**Normative: `spec/schema/sem-details.md`.**
```html
<sem-details view-as="quiz">
  <sem-detail>
    The OIDC token travels in the <highlight>Authorization</highlight> header.
  </sem-detail>
</sem-details>
```
Plain view: `<highlight>` renders `<em>`. Quiz view: occluded (`▮▮▮`), reveal
per item, self-check or auto-check.

**sem-procedure / sem-step** — ordered, status-annotated procedure.
**Normative: `spec/schema/sem-procedure.md`.**
```html
<div class="sem-procedure" data-kind="runbook" role="list">
  <div class="sem-step" role="listitem" data-status="done">provision Infisical path</div>
  <div class="sem-step" role="listitem" data-status="current">port-forward MinIO</div>
  <div class="sem-step" role="listitem">run migrations</div>
  <div class="sem-step" role="listitem" data-status="blocked">cut release</div>
</div>
```
`data-status`: `done|current|todo` (default) `|blocked`; DOM order =
execution order (ordinals positional, CSS counters); status sugar
(`✅/→/❌`) is display-only — `data-status` canonical. **Zero-JS element.**

**sem-properties / sem-property** — definition/properties block.
**Normative: `spec/schema/sem-properties.md`.**
```html
<div class="sem-properties" data-kind="config">
  <div class="sem-property" data-key="token ttl"
       role="definition" aria-label="token ttl">15m</div>
</div>
```
`data-key` = the term, property text = the value. Zero-JS: key column
renders via CSS `attr(data-key)`; AT gets the pair via
`role="definition"` + `aria-label` = key. Compact `term :: value` sugar
(conventions §3) is display-only — `data-key` canonical. Renders
`<dl>`-equivalent grid; **Q2 resolved v1: pure definition list, no
copy/search chrome.**

**sem-views / sem-view** — same content, switchable perspectives.
**Normative: `spec/schema/sem-views.md`.**
```html
<div class="sem-views" id="deploy">
  <div class="sem-view" data-name="Helm" data-active role="tabpanel">content…</div>
  <div class="sem-view" data-name="ArgoCD" role="tabpanel">content…</div>
</div>
```
`data-name` unique per container; `data-active` marks initial view
(first wins if absent); fallback builds the tab bar (`.sem-views-tabs`,
`role="tab"` buttons), arrow-key roving focus; deep-link `#deploy/argocd`;
fires `sem-navigate {id, name, index}`. JS-off: all views stacked,
`data-name`-headed. **Q3 resolved v1: `sem-views`.**

**sem-reveal** — Q→A disclosure, `<details>`-backed.
**Normative: `spec/schema/sem-reveal.md`.**
```html
<div class="sem-reveal" data-summary="Why not localStorage?" collapsed>
  Tokens in localStorage are readable by any script on the page…
</div>
```
`data-summary` optional — first body line (≤60 chars) derives it, by the
one rule in `src/shared/summary.ts` that render and extraction share;
`collapsed` starts hidden, otherwise open. Fallback wraps in native
`<details>/<summary>`; JS-off: fully visible (summary as small-caps
heading). Non-assertive counterpart to `sem-fact` Q/A shape.

**sem-chronology / sem-event** — dated, ordered events; CSS-only timeline.
**Normative: `spec/schema/sem-chronology.md`.**
```html
<div class="sem-chronology" data-kind="release-history" role="list">
  <div class="sem-event" role="listitem" data-when="2026-03-02" data-status="done">
    <time datetime="2026-03-02">2 Mar 2026</time> v0.1 tagged.</div>
</div>
```
`data-when`/`data-until` canonical; `<time>` child is the visible label
(else CSS renders `data-when`); `data-status` optional, same vocabulary as
`sem-step`; `view-as="timeline|list"`. DOM order = chronological order;
ordinals positional. **Zero-JS element.**

**sem-code** — verbatim listing with provenance and copy / wrap.
**Normative: `spec/schema/sem-code.md`.**
```html
<div class="sem-code" data-lang="ts" data-filename="src/rotate.ts" data-mark="2,4-5" data-controls="copy,wrap">
<pre><code>…</code></pre>
</div>
```
Reading bundle adds `.sem-code-chrome` (filename, lang, buttons, status
region), wraps lines (`span|mark.sem-code-line`, text byte-identical),
`tabindex="0"` on an overflowing `<pre>`. JS-off: plain `<pre>` with a
CSS caption. Extraction keeps `source` **verbatim**.

**sem-source** — a section that flips between rendered and authored markup.
**Normative: `spec/schema/sem-source.md`.**
```html
<div class="sem-source" data-label="Facts — flashcards">
  <h2>Facts — flashcards</h2>
  <div class="sem-facts" data-view-as="flashcards">…</div>
</div>
```
Chrome `Rendered | Source` (`aria-pressed`); `data-view-as="source"` shows
the literal markup in a `sem-code` (copy, wrap) built from the core's
pre-enhancement snapshot. Transparent to extraction; JS-off: the rendered
children, nothing else.

**sem-md** — a Markdown block, rendered in the browser.
**Normative: `spec/schema/sem-md.md`.**
```html
<div class="sem-md" data-label="Token lifetimes">
  | Token   | Lifetime | Rotates |
  | :------ | -------: | :-----: |
  | access  | 15 min   | no      |
</div>
```
The element's text is Markdown (GFM tables, headings, lists, emphasis,
links, code, quotes, rules; raw HTML renders as text). The Markdown bundle
adds `.sem-md-chrome` (label, `Markdown` toggle with `aria-pressed`, copy,
status region), renders into `.sem-md-body` (real `<table>` with
`th[scope="col"]`, alignment row honoured) and keeps the normalised source
in a `sem-code` fence (`.sem-md-raw`); `data-view-as="rendered|raw"` is
rewritten by the toggle. JS-off: the source reads as pre-wrapped text.
Extraction keeps `source` **normalised** (dedented), never the rendering.

**sem-references / sem-reference** — numbered citable entries.
**Normative: `spec/schema/sem-references.md`.**
```html
<p>…per use<a href="#r-rfc">[1]</a>.</p>
<div class="sem-references" data-kind="bibliography" role="list">
  <div class="sem-reference" id="r-rfc" role="listitem" data-href="https://…" data-cite="RFC 6749">…</div>
</div>
```
CSS-counter numbering in every tier; reading bundle adds hover / focus
previews on citing anchors (`.sem-references-ref`, popover
`role="tooltip"`, `Esc` closes), backlinks (`aria-label="Back to citation
N"`) and an external link. Citations mint nothing; print shows `(href)`
inside the block only.

**sem-reader** — reading chrome: outline, progress, focus, type, colour,
print, audience. **Normative: `spec/schema/sem-reader.md`.**
```html
<div class="sem-reader" data-controls="outline,progress,focus,type,color,print,audience" data-outline-depth="3">
  <nav aria-label="Contents">…optional, used verbatim…</nav>
</div>
```
One per document, first child of the wrapper. Reading bundle inserts
`.sem-reader-chrome` (`role="region"`), generates the outline from
`h2…h<depth>` when no nav is authored (`aria-current="location"` tracks
the heading in view), and writes `data-sem-mode|type|font` and
`data-color-mode` on `<html>` — persisted via `localStorage`, fail-open.
Audience writes the `sem-audience` hash parameter. No global key
shortcuts. **Mints nothing**; extraction skips it whole (extraction §3
rule 7). The `theme` control is R/W3.

**sem-table** — sortable, filterable authored table.
**Normative: `spec/schema/sem-table.md`.**
```html
<div class="sem-table" data-controls="sort,filter" data-sticky>
  <table><caption>…</caption><thead><tr><th scope="col">…</th></tr></thead>
  <tbody><tr><td data-value="900">15 min</td></tr></tbody></table>
</div>
```
The `<table>` is the contract (no JSON payload). Reading bundle stamps
every body row `data-sem-source-index` once, wraps headers in
`button.sem-table-sort` (`aria-sort` cycle), filters with native `hidden`,
announces via `.sem-table-status`. Extraction returns
`{caption, columns[], rows[][]}` in **authored** order from the stamp —
the recorded §5 exception. `data-sticky` header and `kind="comparison"`
first column are CSS in every tier.

**sem-progress** — completion meter.
**Normative: `spec/schema/sem-progress.md`.**
```html
<div class="sem-progress" data-value="0.62" data-label="coverage"
     role="meter" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0.62"></div>
```
`data-value` canonical 0..1 (render clamps, attr untouched); `data-label`
default `progress`; fallback renders track + fill + `label :: N%`; JS-off:
text-only via CSS `attr()` — no fake bar. `data-status="done"` ⇔ 1 by
convention.

### Tier 1 — flagship buildout

- `sem-facts` full build (filter, shuffle, swipe, quiz scoring).
- `sem-question` — 7 TRP renderers inside quiz views:
```html
<sem-question type="mc">
  <p data-kind="prompt">Which header carries the OIDC token?</p>
  <sem-option correct>Authorization</sem-option>
  <sem-option>Cookie</sem-option>
</sem-question>
```
Types `mc|multi|blank|match|order|tf|short`; `correct` attr canonical,
`✅` sugar; `retry` control; results block; machine view = assertable Q/A.

### Tier 2

- `sem-chronology` / `sem-event when` — ✅ shipped (R/W1, Tier 0 above).
- `sem-table` — ✅ shipped (R/W2, Tier 0 above); `sem-query` deferred.
- `sem-themes controls="picker"` — subsumed by `sem-reader`'s `theme`
  control (R/W3, after Track T).
- `sem-md` — ✅ shipped (R/W2.2, Tier 0 above): Markdown *inside* a
  SemText document. A whole-document md→SemText authoring aid remains
  optional and never required.

## 6. Theme conventions

- `data-sem-theme="<slug>"` on `<html>`; one theme per doc; themes compiled
  from TRP-format YAML → `semtext/themes/<slug>.css`; `--sem-*` tokens;
  `:not(:defined)` vocabulary base included.
- Shadow components read tokens via fallback indirection — zero-JS theme flips.
- Ship 4 TRP ports: `minimal-tech-light` (default), `nocturne-console`,
  `organic-warm`, `editorial-settings`; auto light/dark via
  `prefers-color-scheme`, `data-color-mode` forces.

## 7. Distribution forms

1. **Folder** — `doc.html` + relative `semtext/` (IIFE `semtext.js` + `themes/`).
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
map `sem-fact` to NPL fact/knowledge records; define `sem-enhanced-document`
as a valid MCP `NPLLoad`/render target. ❓ **Q4** who owns the mapping — this
repo exports it, or NPL MCP consumes a schema file we publish?

## 10. Open questions

| # | Question | My lean |
| :-- | :-- | :-- |
| Q1 | bare `<agent>` metadata children vs `sem-`-prefixed | bare (per your example; matches NPL yaml shape) |
| Q2 | `sem-properties` pure `<dl>` v1 | **resolved (this branch)** — pure `<dl>`, chrome only if a consumer demands it |
| Q3 | tabs-family name: `sem-views` vs `sem-perspectives` | **resolved (this branch)** — `sem-views` |
| Q4 | NPL MCP alignment ownership | we publish the schema file; MCP consumes |
| Q5 | fallback handler scope: baseline interactivity only vs full quiz logic | full logic v1 — it's small and makes single-file form Lit-free |
