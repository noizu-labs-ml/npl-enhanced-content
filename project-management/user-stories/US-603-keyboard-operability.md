---
id: US-603
title: "Keyboard operability pass on sem-reader controls + sem-source toggle"
slug: keyboard-operability
personas: [P-006, P-007]
epic: "E6 Accessibility & Degradation"
priority: should-have
complexity: medium
tags: [a11y, keyboard, reader]
---

# US-603: Keyboard Operability Pass

## User Story

**As an** accessibility-first reader
**I want to** operate every reader control and the source toggle from the keyboard with visible focus
**So that** the reading affordances work without a pointer.

## Acceptance Criteria

- **Given** a document with `sem-reader` chrome
  **When** the reader tab-walks the controls (outline, progress, focus, type, color,
  print, audience)
  **Then** each is reachable, operable, shows visible focus, and announces its state.
- **Given** `sem-source`'s rendered/source toggle
  **When** activated from the keyboard
  **Then** the flip occurs, focus stays on the toggle, and scroll position is not lost.

## Notes

The reader controls are real controls (W2 shipped them as spec deliverables); this is
the pass that proves they are keyboard-shaped. P-006's scenarios double as validation
questions — no assistive-tech research exists yet.
