---
id: US-602
title: "Per-element JS-off audit with hide-rule gating tests"
slug: js-off-audit
personas: [P-007]
epic: "E6 Accessibility & Degradation"
priority: must-have
complexity: medium
tags: [a11y, degradation, no-js, testing]
---

# US-602: Per-Element JS-off Audit

## User Story

**As a** JS-off reader
**I want to** every vocabulary element audited to render meaningful text with scripts stripped, enforced by hide-rule gating tests
**So that** the fallback tier's promise holds element by element, not just for the audited ones.

## Acceptance Criteria

- **Given** the full vocabulary (note, facts, details, views, reveal, progress, chronology,
  code, references, reader, table, source, md)
  **When** the scripts-stripped artifact renders each
  **Then** every element presents meaningful text and the `nojs-artifact.cy.js`
  expectations assert it per element.
- **Given** any `display:none` hide rule
  **When** added or modified
  **Then** it is gated on `:is([data-sem-fallback],[data-sem-upgraded])` (the D12
  pattern) and its absence-of-script behavior is tested.

## Notes

In flight on the 2026-10-07 JS-off thread. Extends the audit US-601 starts; the D12/D13
debt rows are precedent — every new hide rule inherits the pattern or inherits the bug.
