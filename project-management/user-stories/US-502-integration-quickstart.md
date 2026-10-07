---
id: US-502
title: "Integration quickstart: three script tags, fallback-first, theme link"
slug: integration-quickstart
personas: [P-004, P-008]
epic: "E5 Onboarding & Distribution"
priority: must-have
complexity: low
tags: [onboarding, integration, docs]
---

# US-502: Integration Quickstart

## User Story

**As a** framework integrator
**I want to** a quickstart that shows the three script tags in the right order with a theme link
**So that** my first working embed takes an afternoon, not a source dive.

## Acceptance Criteria

- **Given** the quickstart page
  **When** a developer follows it start to finish
  **Then** they get a working document page: fallback core first, reading bundle second,
  theme CSS linked, demo document rendering.
- **Given** each bundle in the snippet
  **When** the reader checks sizing
  **Then** the quickstart states each bundle's budget from ROADMAP (14 / 19.5 / 56 /
  12 / 8.5 KB) so integration decisions are informed.
- **Given** a JS-off environment
  **When** the quickstart's page loads
  **Then** the document still reads (the quickstart itself obeys invariant 6).

## Notes

P-004's core frustration (themes ship, no guide). Cheapest high-leverage E5 item.
