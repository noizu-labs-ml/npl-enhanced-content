---
id: US-505
title: "npm landing docs / quickstart redirect"
slug: npm-landing-docs
personas: [P-004]
epic: "E5 Onboarding & Distribution"
priority: could-have
complexity: low
tags: [onboarding, npm, docs]
---

# US-505: npm Landing Docs

## User Story

**As a** framework integrator arriving from npm
**I want to** the package README to route me to the quickstart
**So that** the npm path and the site path teach the same integration.

## Acceptance Criteria

- **Given** the package page on npm
  **When** a developer reads the README
  **Then** it names the real consumption format (classic IIFE scripts installing a
  global — see D9's recorded fix) and links the quickstart (US-502).
- **Given** bundle subpath exports (`semtext/lit`, `semtext/fallback`, `semtext/extract`,
  `semtext/md`, `semtext/themes/*`)
  **When** documented
  **Then** each names the artifact it maps to, matching `package.json` exactly.

## Notes

M5's npm publish prep is the natural home; until the package is published this is a
README-hygiene item only.
