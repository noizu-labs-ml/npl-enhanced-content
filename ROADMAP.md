# ROADMAP — SemText

Living planning doc. **Supersedes PRD.md §10 for forward planning**; PRD.md remains the
format/spec authority (§1–§9 unchanged and binding). Update this file at every milestone
exit — status drift here is a bug.

Status snapshot: **2026-09-21 · develop = f6cf10f (W0 + W1 merged) + R/W2 PR open**

## Non-negotiable invariants (guardrails — every milestone inherits these)

1. **Canonical artifact = standalone XHTML document.** file:// double-click is the
   zero-th acceptance bar; IIFE classic scripts only, no runtime fetch, no ES modules.
2. **Fallback-first.** The universal inline vanilla handler ships with (or before) every
   behavior. Lit upgrades in place: sets `data-sem-upgraded`, removes `data-sem-fallback`.
   Both surfaces are BDD-asserted tiers per element — never one without the other.
3. **Light DOM for content, shadow DOM for chrome only.** Text stays searchable/copyable.
4. **Zero React. Ever.** (PRD non-goal.)
5. **BDD-before-code.** Schema `.md` + cypress spec co-authored before implementation;
   green before the next element (PRD §9, binding).
6. **JS-off documents stay readable.** Hide-rules gated on `data-sem-fallback`; no
   content is unreachable without JS.

## Milestones

| # | Milestone | Status |
|---|---|---|
| M1 | Format spec v0 + Tier-0 schemas + BDD | ✅ complete (re-baselined, see note) |
| M2 | v0.4 class-based baseline demo | ✅ complete (main) |
| M3 | sem-facts / sem-details flagship + Lit upgrade path | 🔶 in progress |
| T  | Theme pipeline (parallel track) | ⬜ not started |
| M4 | sem-question 7 types + highlight occlusion | ⬜ not started |
| M5 | Tier-2 elements + MHTML + distribution + npm publish prep | ⬜ not started |
| R  | Reading experience (W0 foundations → W1 prose → W2 chrome+data → W3 themes) | 🔶 W0 + W1 merged; W2 in PR |

### M1 — Format spec v0 + Tier-0 schemas ✅ (re-baselined)

PRD exit said "9 schemas"; main carries 6 (note, procedure, properties, views, reveal,
progress). **Re-baseline decision:** `sem-fact(s)` and `sem-detail(s)` schemas are *entry
criteria for M3*, not M1 debt — §9 requires schema+spec before code anyway, and those two
schemas exist to serve the flagship build, so they belong where they get used.

### M2 — v0.4 class-based baseline ✅

`web/demo/index.html`: inline CSS + fallback handler, class-based vocabulary
(`div.sem-*`, `data-*` canonical; sugar is display-only). Double-click demo works.

### M3 — Flagship + Lit upgrade path 🔶 in progress

Order matters here — strangler, not big-bang:

1. **PR#2 (feat/lit-upgrade): rebase on post-PR#1 main, re-run full suite, merge.**
   Establishes the Lit precedent: `SemNote` light-DOM LitElement honoring the handoff
   contract; standalone inlined-bundle page (file://, zero network); 5/5 green.
   Pre-merge checklist: rebase, re-run all 7 specs on rebased main.
2. **Co-author `sem-facts` + `sem-details` schemas & BDD** (the M1 re-baseline items).
   Full `view-as` matrix: list / flashcards / quiz.
3. **Implement flagship** on the M2 class baseline with fallback handlers, then the Lit
   upgrades following the SemNote pattern. Naming collision fix rides here (see debt D1).
   **Exit:** demo green on all three view-as modes, fallback-only and upgraded tiers both
   asserted, single-file variant builds.

### T — Theme pipeline (parallel track)

TRP YAML → CSS with `--sem-*` tokens → `semtext/themes/<slug>.css`. Port the 4 TRP themes
(minimal-tech-light default, nocturne-console, organic-warm, editorial-settings).
No dependency on M3/M4; can land in any window. **Exit:** a demo page renders identically
under all 4 themes via `data-sem-theme` swap.

### M4 — sem-question 7 types + occlusion

`mc | multi | blank | match | order | tf | short` + full `<highlight>` cloze occlusion.
Schema+spec first per §9. **Exit:** TRP quiz parity, both tiers asserted.

### R — Reading experience (waves, one PR each → `develop`)

Custom elements and cross-cutting behavior that make long-form SemText
documents readable in a browser, without breaking any invariant above.
Binding decisions: split bundles (fallback core stays small; a new
`dist/semtext-reading.js` carries reader/table/code/references from W1);
Lit elements are thin wrappers over the fallback `enhanceX()`; glossary is
`sem-properties view-as="glossary"`, not an element; `sem-table` sort may
reorder the DOM because every row is stamped `data-sem-source-index` and
extraction restores authored order.

| Wave | Contents | Status |
|---|---|---|
| **W0 Foundations** | D10 + D12 repaid; print stylesheet; `prefers-reduced-motion`; `src/fallback/target.ts` deep-link resolver (opens reveal/note/view/card, `.sem-target`, `beforeprint` disclosure); **audience close-out** (`spec/schema/sem-audiences.md`, `src/fallback/audience.ts`, `data-audience` canonical in `lit/base.ts`, extraction populates `audience`, extraction.md §7 closed); `sem-note view-as="margin"`; `src/shared/summary.ts` shared by render + extraction; budgets below | ✅ merged (#10) |
| W1 Prose | `sem-chronology`/`sem-event` (CSS-only), `sem-code`, `sem-references`/`sem-reference`, glossary mode, `src/shared/popover.ts`, reading bundle + `<!-- sem:inline reading -->` | ✅ merged (#12) |
| W2 Chrome + data | `sem-reader` (outline, progress, focus, type, color, print, audience controls; theme deferred), `sem-table` (sort/filter, source-index ordering), site dogfoods `sem-reader` + shows a live `sem-table`; explicit `[data-color-mode="dark"]` token block | 🔶 in PR (`feature/reading-experience-w2`) |
| W3 Themes | reader `theme` control, dark tokens, retire planned `sem-themes` | ⬜ after Track T |

**Size budgets (raw minified, enforced by `npm run build:strict`)**

| Artifact | W0 | W1 | W2 | W3 |
|---|---|---|---|---|
| `semtext-fallback.js` | **12 KB** (measured 11.9; planned 10 — the shared audience matcher + resolver cost ~4.8 KB over the 7.1 KB baseline, and dropping either would drop a W0 deliverable) | 12 | 12 | 12 |
| `semtext-reading.js` | — | **8** (measured 6.8) | **16** (measured 15.5; planned 14 — see W2 decisions) | 16.5 |
| `semtext.js` (Lit) | 40 | **48** (measured 30.6) | **56** (measured 37.8) | 57 |
| `semtext-extract.js` | 10 | **12** (measured 7.9) | **12** (measured 9.0) | 12 |

**W1 decisions (recorded).** Glossary mode lives in the *reading* bundle,
not the fallback core: the core sits at 11.9 / 12 KB after W0 and the
popover alone would have broken it. The Lit wrappers (`sem-code`,
`sem-references`, `sem-properties`) import the reading bundle's
per-element enhance functions — one behaviour implementation, idempotent
on DOM state so either script may run first. `sem-chronology` mints no
custom element (CSS-only, pattern `sem-procedure`). `sem-code.source` is
extracted verbatim (second recorded exception to normalised text).

**W2 decisions (recorded).** The reading bundle measured **15.5 KB**
against the planned 14 KB, so the budget is set at 16 KB rather than the
plan's figure. The reader alone bundles to 6.4 KB: 4.2 KB of its own
plus the shared `state` (hash + storage) and `audience` (profile parsing)
modules it needs to write the hash and list profiles — both already in
the fallback core, but the reading bundle cannot import from a sibling
IIFE. A compaction pass took the reader from 7.1 to 6.4 KB; going further
would drop a control (each is a spec deliverable) or fork the shared
modules, which is the drift W1 was built to avoid. `sem-reader` is the
second authored element in the extraction skip set (§3 rule 7).
`sem-table` is the vocabulary's only DOM-reordering runtime; extraction
restores authored order from `data-sem-source-index` (§5 recorded
exception) and the inner `<table kind>` mints no record of its own. The
planned JSON payload for `sem-table` is dropped: the authored markup is
the data. The site's W1 audience picker links stay beside the reader's
audience select — both write the same hash parameter — because the copy
documents "a link is a picker". The theme control (`sem-themes` retirement)
remains W3, after Track T.

### M5 — Tier-2 + distribution + publish prep

- Tier-2 elements: ~~chronology~~ (R/W1), ~~table~~ (R/W2), query, ~~theme-picker~~ (→ `sem-reader theme`, R/W3), md-aid.
- Forms: single-file inlined (proven by PR#2's standalone page) and **MHTML round-trip**.
- **Distribution:** apply + seed `cdn.derobot.is` (infra committed on monorepo develop
  e8e2d35b, not yet applied — see monorepo runbook). Assets get `Cache-Control=immutable`
  for hashed names. Portfolio docs reference the CDN instead of vendoring bundles.
- **npm publish prep:** package metadata, versioning policy (additive-safe / reductive-
  breaking), deprecation story published with v0.1.
- **Exit:** zero React, MHTML round-trip verified, CDN serving `semtext.js`, npm pack clean.

## Debt register

Every row: what it costs, what it costs *per change*, and the written trigger to repay.

| ID | Item | Principal | Interest rate | Trigger to repay | Risk |
|---|---|---|---|---|---|
| D1 | `.sem-progress` class names both the progress element and a facts-chrome label | small rename | every element that renders both in one document misbehaves; grows with each new element | ✅ repaid **M3 step 3** (renamed to `.sem-facts-meter`) | correctness |
| D2 | Lit elements upgrade pre-parse — children may not exist at first `updated()`; SemNote retries via rAF | pattern, not code | every new Lit element must re-learn the children-ready problem (or copy the pattern) | document the pattern in a shared base/helper during **M3 step 3** | correctness, per-element friction |
| D3 | PRD.md §10 milestones drifted from reality before this roadmap existed | one pointer note | confusion about which doc is authoritative | PR gets a "see ROADMAP.md" note on next PRD touch | friction |
| D4 | CDN infra committed but unapplied (monorepo develop e8e2d35b) | apply + seed per runbook | assets ship without a distribution host; docs can't reference CDN URLs | **M5** distribution step | delivery |
| D5 | Vanilla fallback handler duplicated verbatim between `web/demo/index.html` and the Lit elements | copy-paste, two homes | any fallback bugfix must be applied twice or drifts | ✅ repaid **this epic** (`src/fallback/**` → `dist/semtext-fallback.js`; the demo page now carries a build marker, not a hand-written IIFE) | correctness |
| D6 | Quiz option shuffle used `sort(() => Math.random() - 0.5)` — not a uniform shuffle, engine-dependent | small rewrite | quiz distractor order is biased and non-portable | ✅ repaid **this epic** (both tiers draw seeded Fisher-Yates from `src/shared/rng.ts`) | correctness |
| D7 | Dead `./preprocess` package export (`dist/preprocess.js` never built) | remove | `npm pack` ships a stale export a consumer could resolve | ✅ repaid **this epic** | delivery |
| D8 | `themes/` declared as a package export/`files` entry with no directory on disk | create + populate | `npm pack` ships a broken export | ✅ repaid **this epic** | delivery |
| D9 | `"type": "module"` vs the `.` export mapping to an IIFE bundle with no ESM/CJS exports — a bundler importing `.` gets a script it can't import from | build-format decision (dual entry or drop the `.` export) | consumers hit a silent/confusing import failure | ✅ repaid **this epic** — the `.` export is dropped rather than faked. The export map is now subpaths that each name the artifact they map to (`semtext/lit`, `semtext/fallback`, `semtext/extract`, `semtext/themes/*`), and `package.json` documents the real format: classic IIFE scripts that install a global and export nothing, consumed via `<script src>` / CDN or as a side-effect import. A dual ESM entry stays available as a later choice, but the manifest no longer promises named imports it cannot deliver | delivery |
| D11 | `web/demo/standalone-lit.html` inlined a hand-pasted copy of `dist/semtext.js`, so every Lit-tier cypress assertion green-lit a frozen artifact rather than current source | build automation | a Lit regression can land fully green; the gap is invisible and unbounded in time | ✅ repaid **this epic** (`scripts/build-standalone.mjs` substitutes the freshly built bundle; cypress now runs against `dist/demo/`) | correctness |
| D13 | `sem-note[collapsed]` anti-flash rule was gated on `:not([data-sem-upgraded])`, so with the bundle absent the body stayed `display:none` with no summary to expand — collapsed note content unreachable with JS off | one selector (`:defined`) | every element that adds a pre-upgrade anti-flash rule inherits the bug | ✅ repaid **this epic** — found by the new scripts-stripped artifact, which is the whole reason it exists | degradation |
| D12 | Ungated `display:none` in the vocabulary hides `.sem-distractor` and every inactive `.sem-view` in the scripts-stripped no-JS artifact — content unreachable with JS off | CSS gating (show distractors and all views when neither tier marker is present) | every new hide-rule inherits the pattern; the no-JS degradation promise stays partly unmet | ✅ repaid **R/W0** — every hide rule gated on `:is([data-sem-fallback],[data-sem-upgraded])`; `sem-views` now marks its container; both tiers stamp `<html>` for the list-view distractor case; `nojs-artifact.cy.js` expectations flipped | degradation |
| D10 | Theme CSS ships no `sem-*:not(:defined)` base — custom-element documents render unstyled before/without the Lit upgrade, contradicting conventions §4 rule 3 which promises exactly this | one CSS block in `themes/_vocabulary.css` | every element added in element form inherits the defect; the scripts-stripped no-JS artifact will fail on it | ✅ repaid **R/W0** — every vocabulary selector is `:is(sem-x, .sem-x)`; the site page's local `sem-note` restatement deleted | correctness, degradation |
| D14 | Audience qualifier was forward-declared (extraction.md §7) with no schema, no fallback, and `lit/base.ts` reading a different attribute (`data-sem-audience`) than extraction (`data-audience`) | schema + handler + one attribute rename | two spellings in flight; a Lit element and the extractor disagree about the same document | ✅ repaid **R/W0** — `spec/schema/sem-audiences.md`, `src/fallback/audience.ts`, `data-audience` canonical everywhere | correctness |
| D15 | Fallback derived reveal summaries as "first eight words + …" while extraction used the schema's 60-char rule | share one function | reader and machine see different summaries for the same reveal | ✅ repaid **R/W0** — `src/shared/summary.ts` | correctness |

## Open decisions (must close before their dependent milestone exits)

| Decision | Gates | Notes |
|---|---|---|
| Bare `<agent>` metadata children vs `sem-`-prefixed names | M3 exit (root document shape) | flagged in PRD meta-review; still open |
| MHTML vs plain single-file as the "portable" primary | M5 | single-file already proven; MHTML round-trip untested |
| CDN single vs 2 replicas | M5 distribution | single is fine for cache-efficiency; scale if availability matters |

## Review cadence

Revisit at every milestone exit and whenever a PR merges that changes scope. If this file
and PRD.md §10 disagree, this file wins for planning; flag the delta in the next PR.
