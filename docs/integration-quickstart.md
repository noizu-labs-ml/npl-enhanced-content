# Integration quickstart — embedding SemText in a host site

Audience: developers adding SemText to an existing site or app (persona
P-004, "Framework Integrator"). Goal: a working, themed page in an
afternoon. This is a how-to; the normative contract is
[`spec/conventions.html`](../spec/conventions.html) and the per-element
schemas under [`spec/schema/`](../spec/schema/). For writing SemText
documents (as opposed to serving them), see the
[authoring guide](./authoring-guide.md).

## The model in one paragraph

A SemText document is a plain XHTML file. Three script tiers can drive it:
**none** (vocabulary CSS alone renders a readable document — this is the
contract tier), the **fallback bundle** (vanilla JS, baseline
interactivity), and the **Lit bundle** (interactive custom elements that
upgrade the fallback's work in place). Your job as a host is to link the
CSS, load the scripts in the right order, and do nothing that breaks the
zero-JS tier.

## Getting the artifacts

The npm package is `semtext`. Each artifact is a classic IIFE script that
installs a global and exports **nothing** — consume a subpath as a
`<script src>` tag (or a CDN URL), or as a side-effect ESM import
(`import 'semtext/lit'`). Named imports are not available from any
subpath, and there is deliberately no `.` root export.

- **npm / bundler:** `npm install semtext`, then resolve
  `semtext/fallback`, `semtext/reading`, `semtext/lit` etc. to their
  `dist/*.js` files and emit them as script tags (a side-effect import
  also works).
- **Vendored folder (portable docs):** copy `dist/*.js` + `themes/` next
  to your document as `semtext/` — this is distribution form 1 in the
  spec (§7) and is what makes `file://` double-click work.
- **CDN:** releases publish to `cdn.semtext.dev` under an immutable
  `/<version>/` prefix plus a mutable `/latest/` pointer (see
  [`CONTRIBUTING.md`](../CONTRIBUTING.md)). Pin `/<version>/` in
  production; treat `/latest/` as a convenience for experiments only.

## The five bundles

Sizes below are measured from the current `develop` build (raw minified /
gzipped; CI enforces these as budgets via `build:strict`):

| File | Size | Global | Drives | Load it when |
|---|---|---|---|---|
| `dist/semtext-fallback.js` | 13.1 KB / 4.7 KB | `SemTextFallback` | Baseline interactivity: `view-as` switching, reveals, `<highlight>` occlusion, quiz checking, audience gating, deep links, the `sem-source` snapshot | **Always.** This is the zero-JS contract's only scripted tier |
| `dist/semtext-reading.js` | 19.4 KB / 6.8 KB | `SemTextReading` | `sem-code` chrome, `sem-references` previews/backlinks, glossary mode, `sem-reader` chrome, `sem-table` sort/filter, the `sem-source` source fence | Your document carries code, references, a reader, tables, or a glossary |
| `dist/semtext.js` | 49.5 KB / 17.0 KB | `SemText` | Lit 3 interactive upgrades of `sem-note`, `sem-facts`, `sem-details`, `sem-properties`, `sem-code`, `sem-references`, `sem-reader`, `sem-table`, `sem-source`, `sem-md` | You want the full interactive surface |
| `dist/semtext-md.js` | 8.0 KB / 3.5 KB | `SemTextMd` | `sem-md` (Markdown block rendering) only | The document contains `sem-md` |
| `dist/semtext-extract.js` | 9.7 KB / 3.5 KB | `SemTextExtract` | DOM → annotated plain text extraction for terminal/LLM pipelines | You are consuming documents programmatically, not rendering them |

`sem-procedure`, `sem-chronology` and `sem-audiences` are **zero-JS
elements**: CSS renders them completely, no script ever defines them.

## Load order

```html
<link rel="stylesheet" href="semtext/themes/_vocabulary.css">
<link rel="stylesheet" href="semtext/themes/minimal-tech-light.css">

<!-- 1. fallback core: always first -->
<script src="semtext/semtext-fallback.js"></script>
<!-- 2. optional enhancements -->
<script src="semtext/semtext-reading.js"></script>
<script src="semtext/semtext-md.js"></script>
<!-- 3. Lit upgrade, defer, last -->
<script defer src="semtext/semtext.js"></script>
```

The rules behind that order:

- **Fallback first.** Its handlers run at `DOMContentLoaded` and it must
  snapshot every `sem-source` wrapper's markup *before* any other handler
  mutates the subtree (spec §4 rule 1). Load it before `reading`/`md`.
- **`reading` and `md` are order-independent** with respect to each
  other; each re-checks for unwired elements.
- **Lit `defer`, and it does not matter where.** Components upgrade in
  place (set `data-sem-upgraded`, remove `data-sem-fallback`) and skip
  anything the fallback already wired.
- `semtext-extract.js` is a pipeline tool, not a page script — do not
  put it on a reading page.

For a **portable document** (double-click from `file://`, shareable as
one file), the spec requires the fallback handler *embedded inline* in
the page (`<script id="sem-fallback">…</script>`) rather than fetched —
portable docs make no runtime requests (§7). Use
`scripts/build-standalone.mjs` to assemble that form; it is what builds
this repo's own demos and spec pages.

## Theming

Two stylesheets: `themes/_vocabulary.css` (required — it gives every
`sem-*` element its box before and without any custom element
definition) and one theme file (today the repo ships
`themes/minimal-tech-light.css`; the wider theme set is gated on the W3
theme pipeline, see `ROADMAP.md`). Set the theme on `<html>`:

```html
<html lang="en" data-sem-theme="minimal-tech-light">
```

Themes are plain CSS files (`--sem-*` tokens); link them from your own
hosting — `themes/*` ships in the published image and the npm package
(`files: ["dist", "themes"]`). Do not fork the vocabulary CSS to
re-theme; override `--sem-*` tokens or add a theme file.

## What renders with JavaScript off

With only the vocabulary CSS and no script at all, a SemText document is
complete and readable: **every hide rule in the vocabulary is gated on a
tier marker** (`data-sem-fallback` / `data-sem-upgraded`, set only by
scripts). No script ⇒ nothing is hidden — distractors render labelled,
tab views stack under their names, collapsed bodies show, all
audience-qualified content is visible. Zero-JS elements (`sem-procedure`,
`sem-chronology`, `sem-audiences`, `sem-properties`, `sem-progress`,
`sem-table` markup, `sem-code`'s `<pre>`) never needed a script in the
first place. The mechanism is spec §4 rules 3–4; read that, don't
re-derive it.

The repo proves this per page: `npm run build` emits a script-stripped
`<name>.nojs.html` variant next to every demo and spec page in `dist/`.
Adopt the same check for your own hosted documents if you can — the
honest test is *scripts removed*, not JS disabled.

## Minimal working example

```
mysite/
  index.html
  semtext/
    semtext-fallback.js
    semtext-reading.js
    semtext.js
    themes/_vocabulary.css
    themes/minimal-tech-light.css
```

```html
<!doctype html>
<html lang="en" data-sem-theme="minimal-tech-light">
<head>
  <meta charset="utf-8">
  <title>Rotation runbook</title>
  <link rel="stylesheet" href="semtext/themes/_vocabulary.css">
  <link rel="stylesheet" href="semtext/themes/minimal-tech-light.css">
  <script src="semtext/semtext-fallback.js"></script>
  <script src="semtext/semtext-reading.js"></script>
  <script defer src="semtext/semtext.js"></script>
</head>
<body>
<sem-enhanced-document>
  <h1 data-kind="title">Token rotation runbook</h1>

  <sem-note variant="warning">Rotation is <strong>per session</strong>.</sem-note>

  <sem-procedure kind="runbook" role="list">
    <sem-step role="listitem" status="done">provision the secret</sem-step>
    <sem-step role="listitem" status="current">cut the release</sem-step>
  </sem-procedure>

  <sem-facts view-as="flashcards">
    <sem-fact id="f-jwt" kind="concept">
      <statement>JWTs rotate per session</statement>
      <conclusion>Short-lived access; the refresh grant issues a new pair.</conclusion>
    </sem-fact>
  </sem-facts>
</sem-enhanced-document>
</body>
</html>
```

Serve it over HTTP (or open it from `file://` — the folder form needs no
server). `<sem-enhanced-document>` is the required root wrapper; the
fallback handler scopes to it and Lit registers against it.

## Common pitfalls

- **Attribute spelling by element kind.** Bare parameters (`view-as`,
  `status`, `kind`) are canonical **on `sem-*` custom elements** and
  their part children. On a **standard HTML element** (`<h2>`, `<td>`,
  `<p>`) the same qualifier must be spelled `data-*`
  (`<h2 data-kind="section">`) — HTML5 allows no other custom attribute
  there. Both tiers read both spellings on either kind of element.
- **Never write both spellings on one element.** `data-*` wins, but the
  combination is defined as an authoring error (spec §2), and a
  `sem-source` fence will display markup the tiers disagree about.
- **Don't author runtime state.** `data-sem-fallback`,
  `data-sem-upgraded`, `data-active` etc. are written by the tiers.
- **Don't import named exports.** No subpath has any; there is no `.`
  export at all. The globals are `SemText`, `SemTextFallback`,
  `SemTextReading`, `SemTextExtract`, `SemTextMd`.
- **Keep `id="sem-fallback"`** if you inline the fallback handler —
  that id is the spec's contract for the embedded script.
- **Don't add ungated `display:none`.** Any hiding your host CSS adds
  must be gated on the tier markers, or you have broken the zero-JS
  contract for your page.

## Version pinning

Two independent versions, don't conflate them:

- **`specVersion`** (`"0.5"` in `package.json`) labels the *format
  draft* the documents and demo copy self-describe as. It moves with the
  spec, not with releases.
- **`version`** (the npm package version) labels the *artifacts*. Bundle
  files are stamped at build; the CDN publishes each release under an
  immutable `/<version>/` prefix, so pinning the CDN path or the npm
  version both give you a fixed artifact set.

A document authored against spec v0.5 reads correctly under every tier
of every artifact that accepts v0.5; check `spec/conventions.html` for
the current draft before pinning an older artifact set.

## Where to go next

- Writing documents: [authoring guide](./authoring-guide.md)
- Normative reference: [`spec/conventions.html`](../spec/conventions.html),
  per-element contracts in [`spec/schema/`](../spec/schema/)
- Sizes/budgets and wave status: [`ROADMAP.md`](../ROADMAP.md)
- Release/branch policy and CDN publishing:
  [`CONTRIBUTING.md`](../CONTRIBUTING.md)
