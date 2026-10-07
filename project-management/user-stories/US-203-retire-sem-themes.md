---
id: US-203
title: "Retire sem-themes with a spec migration note"
slug: retire-sem-themes
personas: [P-003, P-005]
epic: "E2 W3 Reader Themes"
priority: should-have
complexity: low
tags: [themes, spec, gated]
---

# US-203: Retire sem-themes with a Spec Migration Note

## User Story

**As a** spec steward
**I want to** the planned `sem-themes` element removed from the roadmap vocabulary in favor of the reader theme control
**So that** theming has one home and the spec does not promise two.

## Acceptance Criteria

- **Given** the spec and ROADMAP
  **When** W3 exits
  **Then** `sem-themes` is marked retired-with-migration-note, not merely dropped; the
  spec says what replaces it and why.
- **Given** an existing document that references `sem-themes`
  **When** it renders
  **Then** nothing breaks (retirement is documented, not destructive).

## Notes

**GATED on Track T.** The W2 record already deferred "sem-themes retirement" to W3.
