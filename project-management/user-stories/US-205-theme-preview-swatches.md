---
id: US-205
title: "Theme preview swatches in the reader control"
slug: theme-preview-swatches
personas: [P-003]
epic: "E2 W3 Reader Themes"
priority: could-have
complexity: low
tags: [themes, ux, gated]
---

# US-205: Theme Preview Swatches

## User Story

**As a** human reader
**I want to** see small color swatches next to theme options
**So that** I pick a mode by what it looks like, not by name.

## Acceptance Criteria

- **Given** the reader theme control
  **When** it renders
  **Then** each option carries a swatch drawn from the theme's actual tokens.
- **Given** the fallback tier (no script)
  **When** the control is unenhanced
  **Then** the swatches are inert decoration and the plain options still work — no
  content is hidden behind them.

## Notes

**GATED on Track T.** Deliberately `could-have`: polish after the control itself works.
Falls under the E6 degradation rule (invariant 6) if shipped.
