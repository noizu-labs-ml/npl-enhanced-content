---
id: US-201
title: "Theme control in sem-reader (light/dark/system + per-doc pinning)"
slug: reader-theme-control
personas: [P-003, P-006]
epic: "E2 W3 Reader Themes"
priority: must-have
complexity: medium
tags: [themes, reader, gated]
---

# US-201: Theme Control in sem-reader

## User Story

**As a** human reader
**I want to** switch the reading chrome between light, dark, and system from the sem-reader control bar, with a per-document pin
**So that** I read in the color mode I want without touching site-wide settings.

## Acceptance Criteria

- **Given** a document dogfooding `sem-reader`
  **When** the theme control is used
  **Then** light/dark/system each render with no inverted-alias tokens and no content shift.
- **Given** a document that pins a theme
  **When** it renders
  **Then** the pin wins over the reader default (per-doc pinning is possible).

## Notes

**GATED on Track T** (theme pipeline: TRP YAML → CSS `--sem-*` tokens →
`semtext/themes/<slug>.css`). Plan only until the gate opens — see ROADMAP E2. W2 left
the explicit `[data-color-mode="dark"]` token block in place for exactly this.
