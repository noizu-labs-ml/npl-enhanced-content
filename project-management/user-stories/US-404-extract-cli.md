---
id: US-404
title: "semtext extract CLI subcommand (headless)"
slug: extract-cli
personas: [P-002]
epic: "E4 Agent Surface"
priority: should-have
complexity: medium
tags: [agent, extraction, cli]
---

# US-404: semtext extract CLI

## User Story

**As an** LLM agent operator
**I want to** a headless `semtext extract` subcommand
**So that** pipelines can extract structure from documents without a browser.

## Acceptance Criteria

- **Given** a valid document file
  **When** `semtext extract doc.xhtml` runs
  **Then** it emits the extraction record using the same code as the browser extract
  tier (one implementation, two hosts).
- **Given** an invalid document
  **When** extraction runs
  **Then** it fails with the validator's diagnostics (US-301) or a clear structural
  error — not a partial silent record.

## Notes

Headless parity is the acceptance bar: `semtext-extract.js` and the CLI must not drift,
or the published contract (US-401) becomes untestable outside the browser.
