# npl-enhanced-content (SemText)

**Repo:** https://github.com/noizu-labs-ml/npl-enhanced-content

SemText — XHTML-first semantic markup: one document that reads as a styled interactive page, a structural record for LLMs, and plain text in a terminal. Rendered by Lit web components over a zero-JS fallback tier. Zero React.

```html
<sem-enhanced-document>
  <sem-note variant="warning">Refresh tokens rotate per use.</sem-note>
  <sem-facts view-as="flashcards">
    <sem-fact id="f-jwt" kind="concept">
      <statement>JWTs rotate per session</statement>
      <conclusion>Short-lived access; the refresh grant issues a new pair.</conclusion>
    </sem-fact>
  </sem-facts>
  <sem-procedure kind="runbook" role="list">
    <sem-step role="listitem" status="done">provision the secret</sem-step>
    <sem-step role="listitem" status="current">cut the release</sem-step>
  </sem-procedure>
</sem-enhanced-document>
```

The vocabulary is **custom elements with bare attributes** (`view-as`, `status`, `kind`, `key`). The older `div.sem-*` + `data-*` spelling is a compatibility alias every tier still accepts — see `spec/conventions.md` Appendix A.

## What

The NPL ecosystem's rich-content spec plus its JavaScript artifacts (`package` name: `semtext`):

- **`spec/`** — normative format specs: conventions (`.md`/`.html`), extraction rules, and `spec/schema/` (Tier-0 schemas).
- **`src/`** — three classic-IIFE artifacts, each installing a global and exporting nothing (consume as `<script src>`/CDN or side-effect ESM import): `SemText` (`semtext/lit`, registers the Lit custom elements), `SemTextFallback` (`semtext/fallback`, zero-JS tier), `SemTextExtract` (`semtext/extract`). `themes/*` ships as raw theme CSS.
- **`web/`** — demo + site; **`test/`** — Cypress e2e + support; **`docs/`** — PROJ-ARCH/LAYOUT/SCHEMA docs with `.summary.md` digests.

There is deliberately no `.` export — ROADMAP debt D9: dropping it removes the false promise of an importable root rather than papering over it.

## Why

NPL content was plain text; agents and humans need the same document to serve both. SemText makes XHTML the canonical form: LLMs read structure, browsers render styled interactive content via Lit islands, and terminal/plain-text consumers get a graceful reduction — one source, three readings, no React runtime.

## Getting Started

```bash
npm install
npm run build           # scripts/build.mjs + build-standalone.mjs → dist/
npm run build:strict    # build with strict size budget
npm run test:unit       # vitest
npm test                # cypress e2e (run AFTER npm run build — tests run against dist/demo/, not web/demo/ markers)
npm run serve           # vite preview on :4173
```

## How It Works

- Author XHTML using the SemText conventions/spec; the `lit` artifact registers custom elements that progressively enhance it in the browser; the `fallback` artifact provides the zero-JS rendering tier; the `extract` artifact pulls the plain-text/structural reduction.
- Top-level directories are domains: `spec/`, `src/` (`lit/`, `fallback/`, `extract/`, `shared/`), `themes/` (kept top-level as a subpath export + CDN asset), `web/`, `test/`, `scripts/`, `docs/`.
- Builds enforce a size budget (`build:strict`); theme CSS doubles as a CDN asset.

## Docs

`docs/PROJ-ARCH.md`, `docs/PROJ-LAYOUT.md`, `docs/PROJ-SCHEMA.md` (digests alongside); normative specs in `spec/`.

## Analytics (GA4)

Analytics are off by default. The measurement id is a **deploy-time** value, not
a build-time one: `index.html` ships an inert `<!-- GA_MEASUREMENT_ID_SNIPPET -->`
marker, and `docker/20-ga-measurement-id.sh` (run by nginx's stock
`/docker-entrypoint.d/` hook on every container start) regenerates the served
page from a pristine template in the image.

- `GA_MEASUREMENT_ID` set to a `[A-Za-z0-9_-]+` id → the gtag snippet is injected.
- unset, empty, or malformed → the marker line is dropped entirely: no script
  tag, no partial tag, no comment, no JS.

Enable it via the chart value:

```yaml
gaMeasurementId: "G-XXXXXXXXXX"   # helm/<chart>/values.yaml, default ""
```

Flipping it is a redeploy of the same image — no rebuild.
