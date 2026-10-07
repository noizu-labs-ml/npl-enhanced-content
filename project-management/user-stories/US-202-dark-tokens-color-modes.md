---
id: US-202
title: "Dark tokens via color-modes contract, not inverted aliases"
slug: dark-tokens-color-modes
personas: [P-003, P-006]
epic: "E2 W3 Reader Themes"
priority: must-have
complexity: medium
tags: [themes, tokens, gated]
---

# US-202: Dark Tokens via Color-Modes Contract

## User Story

**As a** human reader
**I want to** dark mode built from a proper color-modes token contract
**So that** dark rendering is designed, not a light theme with colors inverted.

## Acceptance Criteria

- **Given** the theme pipeline output (Track T)
  **When** `[data-color-mode="dark"]` applies
  **Then** every token resolves from the dark facet per the color-modes contract — no
  alias-inversion layer (known fleet trap: inverted aliases flip variant colors).
- **Given** an element styled only with vocabulary tokens
  **When** the mode switches
  **Then** it renders correctly with no per-element dark overrides.

## Notes

**GATED on Track T.** Extends the W2 dark token block into the full contract once
themes land.
