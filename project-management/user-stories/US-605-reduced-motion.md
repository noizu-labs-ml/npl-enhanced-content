---
id: US-605
title: "Reduced-motion coverage for reader transitions"
slug: reduced-motion
personas: [P-006, P-003]
epic: "E6 Accessibility & Degradation"
priority: could-have
complexity: low
tags: [a11y, motion, reader]
---

# US-605: Reduced-Motion Coverage for Reader Transitions

## User Story

**As an** accessibility-first reader with `prefers-reduced-motion` set
**I want to** reader transitions (view flips, source toggles, any W3 theme transition) to respect reduced motion
**So that** the document never animates against my settings.

## Acceptance Criteria

- **Given** `prefers-reduced-motion: reduce`
  **When** any reading transition runs
  **Then** it resolves instantly (or to a minimal opacity fade) with no positional
  animation.
- **Given** W0's existing reduced-motion pass
  **When** new transitions are added (reader controls since W2, themes in W3)
  **Then** each inherits the rule — new transitions ship with their reduced-motion
  story, not after.

## Notes

Validation-question framing: W0 shipped a pass, but there is no automated reduced-motion
coverage — this story adds the assertions, not just the CSS.
