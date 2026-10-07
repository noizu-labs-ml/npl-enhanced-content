---
id: US-601
title: "Fix sem-progress JS-off rendering (CSS attr() text rule)"
slug: sem-progress-js-off
personas: [P-007, P-006]
epic: "E6 Accessibility & Degradation"
priority: must-have
complexity: low
tags: [a11y, degradation, no-js]
---

# US-601: Fix sem-progress JS-off Rendering

## User Story

**As a** JS-off reader
**I want to** `sem-progress` to render meaningful text with scripts stripped
**So that** the progress affordance is not silently blank in the tier that is the contract for me.

## Acceptance Criteria

- **Given** a document with `sem-progress`
  **When** it renders in the scripts-stripped no-JS artifact
  **Then** the element shows its progress as text (CSS `attr()` text rule), not nothing.
- **Given** either tier marker present (`data-sem-fallback` or `data-sem-upgraded`)
  **When** the enhanced version renders
  **Then** behavior is unchanged — the fix only alters the no-script surface.

## Notes

Repo finding F8, known since W0. In flight on the 2026-10-07 JS-off thread.
