---
id: P-003
name: "Human Reader"
slug: human-reader
archetype: "Engineer reading long docs and flipping views to match depth"
segment: primary
tags: [reading, views]
---

# P-003: Human Reader

## Demographics

| Attribute | Value |
|-----------|-------|
| Age | 25–45 |
| Occupation | Software engineer reading specs, runbooks, handbooks |
| Location | Anywhere |
| Tech comfort | high |

## Bio

The consumer of everything P-001 writes. Reads long documents in bursts, skims first,
reads deeply second, and wants the document to adapt to that instead of fighting it. She
switches between rendered and source views and between audience levels without wanting
to lose her place.

## Goals
- Flip views (rendered/source), audience depth, and chrome on and off without the
  content moving under her.
- Find her place in a long document via outline and progress affordances.
- Read comfortably: color modes, print, dark tokens that do not invert badly.

## Frustrations
- Reader chrome has no theme control yet — dark mode exists as a token block (W2) but
  no reader-level switch (W3 is gated on Track T).
- View/audience switching that reflows or scrolls the page is disorienting.

## Behaviors
- Keyboard-first habits; expects controls reachable without a mouse.
- Uses print/PDF export for offline and annotation passes.

## Job to Be Done
> "When I read a long doc, I want to flip views/audiences without the content moving,
> so I read at my own depth."

## Relationship to Product

The persona the W0–W2 reading waves were built for, and the direct beneficiary of W3
themes (UC-3, UC-4) and E6 print/keyboard work (UC-6). Dogfooding on the live site is
aimed squarely at her.

## Scenarios
- **Scenario 1: Depth-switching** — she opens a 40-section spec, sets her audience to
  "operator," reads three sections, then flips to source view to check an example —
  none of it shifts her scroll position (US-201, US-204, US-603).
- **Scenario 2: Late-night + print** — she reads dark at night and prints a chapter the
  next morning; both renderings are legible (US-202, US-604).
