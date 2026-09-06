# ROADMAP — npl-enhanced-content

Living planning doc. **Supersedes PRD.md §10 for forward planning**; PRD.md remains the
format/spec authority (§1–§9 unchanged and binding). Update this file at every milestone
exit — status drift here is a bug.

Status snapshot: **2026-09-01 · main = 19cb226 (PR#1 merged)**

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

### M1 — Format spec v0 + Tier-0 schemas ✅ (re-baselined)

PRD exit said "9 schemas"; main carries 6 (note, procedure, properties, views, reveal,
progress). **Re-baseline decision:** `sem-fact(s)` and `sem-detail(s)` schemas are *entry
criteria for M3*, not M1 debt — §9 requires schema+spec before code anyway, and those two
schemas exist to serve the flagship build, so they belong where they get used.

### M2 — v0.4 class-based baseline ✅

`demo/index.html`: inline CSS + fallback handler, class-based vocabulary
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

TRP YAML → CSS with `--sem-*` tokens → `npl/themes/<slug>.css`. Port the 4 TRP themes
(minimal-tech-light default, nocturne-console, organic-warm, editorial-settings).
No dependency on M3/M4; can land in any window. **Exit:** a demo page renders identically
under all 4 themes via `data-sem-theme` swap.

### M4 — sem-question 7 types + occlusion

`mc | multi | blank | match | order | tf | short` + full `<highlight>` cloze occlusion.
Schema+spec first per §9. **Exit:** TRP quiz parity, both tiers asserted.

### M5 — Tier-2 + distribution + publish prep

- Tier-2 elements: chronology, table, query, theme-picker, md-aid.
- Forms: single-file inlined (proven by PR#2's standalone page) and **MHTML round-trip**.
- **Distribution:** apply + seed `cdn.derobot.is` (infra committed on monorepo develop
  e8e2d35b, not yet applied — see monorepo runbook). Assets get `Cache-Control=immutable`
  for hashed names. Portfolio docs reference the CDN instead of vendoring bundles.
- **npm publish prep:** package metadata, versioning policy (additive-safe / reductive-
  breaking), deprecation story published with v0.1.
- **Exit:** zero React, MHTML round-trip verified, CDN serving `npl.js`, npm pack clean.

## Debt register

Every row: what it costs, what it costs *per change*, and the written trigger to repay.

| ID | Item | Principal | Interest rate | Trigger to repay | Risk |
|---|---|---|---|---|---|
| D1 | `.sem-progress` class names both the progress element and a facts-chrome label | small rename | every element that renders both in one document misbehaves; grows with each new element | ✅ repaid **M3 step 3** (renamed to `.sem-facts-meter`) | correctness |
| D2 | Lit elements upgrade pre-parse — children may not exist at first `updated()`; SemNote retries via rAF | pattern, not code | every new Lit element must re-learn the children-ready problem (or copy the pattern) | document the pattern in a shared base/helper during **M3 step 3** | correctness, per-element friction |
| D3 | PRD.md §10 milestones drifted from reality before this roadmap existed | one pointer note | confusion about which doc is authoritative | PR gets a "see ROADMAP.md" note on next PRD touch | friction |
| D4 | CDN infra committed but unapplied (monorepo develop e8e2d35b) | apply + seed per runbook | assets ship without a distribution host; docs can't reference CDN URLs | **M5** distribution step | delivery |
| D5 | Vanilla fallback handler duplicated verbatim between `demo/index.html` and the Lit elements | copy-paste, two homes | any fallback bugfix must be applied twice or drifts | ✅ repaid **this epic** (`src/fallback/**` → `dist/npl-fallback.js`; the demo page now carries a build marker, not a hand-written IIFE) | correctness |
| D6 | Quiz option shuffle used `sort(() => Math.random() - 0.5)` — not a uniform shuffle, engine-dependent | small rewrite | quiz distractor order is biased and non-portable | ✅ repaid **this epic** (both tiers draw seeded Fisher-Yates from `src/shared/rng.ts`) | correctness |
| D7 | Dead `./preprocess` package export (`dist/preprocess.js` never built) | remove | `npm pack` ships a stale export a consumer could resolve | ✅ repaid **this epic** | delivery |
| D8 | `themes/` declared as a package export/`files` entry with no directory on disk | create + populate | `npm pack` ships a broken export | ✅ repaid **this epic** | delivery |
| D9 | `"type": "module"` vs the `.` export mapping to an IIFE bundle with no ESM/CJS exports — a bundler importing `.` gets a script it can't import from | build-format decision (dual entry or drop the `.` export) | consumers hit a silent/confusing import failure | **M5** publish prep | delivery |
| D11 | `demo/standalone-lit.html` inlined a hand-pasted copy of `dist/npl.js`, so every Lit-tier cypress assertion green-lit a frozen artifact rather than current source | build automation | a Lit regression can land fully green; the gap is invisible and unbounded in time | ✅ repaid **this epic** (`scripts/build-standalone.mjs` substitutes the freshly built bundle; cypress now runs against `dist/demo/`) | correctness |
| D13 | `sem-note[collapsed]` anti-flash rule was gated on `:not([data-sem-upgraded])`, so with the bundle absent the body stayed `display:none` with no summary to expand — collapsed note content unreachable with JS off | one selector (`:defined`) | every element that adds a pre-upgrade anti-flash rule inherits the bug | ✅ repaid **this epic** — found by the new scripts-stripped artifact, which is the whole reason it exists | degradation |
| D12 | Ungated `display:none` in the vocabulary hides `.sem-distractor` and every inactive `.sem-view` in the scripts-stripped no-JS artifact — content unreachable with JS off | CSS gating (show distractors and all views when neither tier marker is present) | every new hide-rule inherits the pattern; the no-JS degradation promise stays partly unmet | **axes wave**, alongside D10 | degradation |
| D10 | Theme CSS ships no `sem-*:not(:defined)` base — custom-element documents render unstyled before/without the Lit upgrade, contradicting conventions §4 rule 3 which promises exactly this | one CSS block in `themes/_vocabulary.css` | every element added in element form inherits the defect; the scripts-stripped no-JS artifact will fail on it | **axes wave** (`sem-controls` + no-JS build artifact both depend on it) | correctness, degradation |

## Open decisions (must close before their dependent milestone exits)

| Decision | Gates | Notes |
|---|---|---|
| Bare `<agent>` metadata children vs `sem-`-prefixed names | M3 exit (root document shape) | flagged in PRD meta-review; still open |
| MHTML vs plain single-file as the "portable" primary | M5 | single-file already proven; MHTML round-trip untested |
| CDN single vs 2 replicas | M5 distribution | single is fine for cache-efficiency; scale if availability matters |

## Review cadence

Revisit at every milestone exit and whenever a PR merges that changes scope. If this file
and PRD.md §10 disagree, this file wins for planning; flag the delta in the next PR.
