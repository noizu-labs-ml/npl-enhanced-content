---
id: US-204
title: "Theme preference persists per origin and honors prefers-color-scheme on first visit"
slug: theme-preference-persistence
personas: [P-003, P-006]
epic: "E2 W3 Reader Themes"
priority: should-have
complexity: low
tags: [themes, ux, gated]
---

# US-204: Persist Theme Preference per Origin

## User Story

**As a** human reader
**I want to** my theme choice to persist across pages on the same origin, with the system preference respected until I choose
**So that** I set it once per site and the first visit is already right.

## Acceptance Criteria

- **Given** a visitor who has chosen a theme
  **When** they open another page on the same origin
  **Then** the chosen theme applies (per-origin storage, same mechanism as the reader's
  existing hash/storage state).
- **Given** a first visit with no stored choice
  **When** the page renders
  **Then** it follows `prefers-color-scheme` (system default, no flash).

## Notes

**GATED on Track T.** Follows the pattern the reader already uses for audience/focus state.
