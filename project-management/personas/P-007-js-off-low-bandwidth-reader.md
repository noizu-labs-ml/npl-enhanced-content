---
id: P-007
name: "JS-off / Low-bandwidth Reader"
slug: js-off-low-bandwidth-reader
archetype: "Reader for whom the fallback tier IS the product"
segment: edge-case
tags: [fallback, no-js]
---

# P-007: JS-off / Low-bandwidth Reader

## Demographics

| Attribute | Value |
|-----------|-------|
| Age | any |
| Occupation | Any reader on a constrained client: scripts blocked, metered connection, hardened browser, archived copy |
| Location | Anywhere; bandwidth is the constraint, not geography |
| Tech comfort | low–high (the constraint is the environment, not the person) |

## Bio

Anyone who opens a SemText document where JavaScript does not run: a security-hardened
browser, a text-mode fetch, a metered connection that stalls on bundles, or an archive
snapshot years from now. For this person the fallback tier is not a graceful
degradation — it is the entire product.

## Goals
- Read every element as meaningful text with zero scripts: facts, views (including
  distractors' containers), reveals, notes, progress.
- Never hit a hidden element — content that `display:none` gates away is content she
  cannot get.

## Frustrations
- `sem-progress` currently renders nothing with JS off (repo finding F8, known since
  W0) — exactly the class of failure she exists to catch.
- Any element whose hide-rule forgets the `:is([data-sem-fallback],[data-sem-upgraded])`
  gating pattern (the D12 lesson).

## Behaviors
- Reads the raw HTML when a page is blank.
- Abandons documents that require "enable JavaScript to continue" — and tells people
  the format failed.

## Job to Be Done
> "When I open a SemText document with scripts stripped or starved, I want the bottom
> tier to be the contract — every element degrades to readable text — so the document
> is never blank."

## Relationship to Product

The persona the founding invariant 6 ("JS-off documents stay readable") and the
scripts-stripped no-JS Cypress artifact exist for. Her stories are E6's must-haves
(US-601, US-602) plus a stake in keyboard-adjacent degradation (US-603).

## Scenarios
- **Scenario 1: Scripts stripped** — she opens the demo with JavaScript disabled:
  every element, including `sem-progress`, renders meaningful text and the no-JS
  artifact test suite agrees (US-601, US-602).
- **Scenario 2: Metered connection** — she loads the 14 KB fallback core over a slow
  link; the document is readable before — or entirely without — the reading bundle
  arrives (US-602).
