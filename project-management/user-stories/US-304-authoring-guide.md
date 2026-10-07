---
id: US-304
title: "Authoring guide: your first SemText document"
slug: authoring-guide
personas: [P-001]
epic: "E3 Authoring & Validation"
priority: should-have
complexity: low
tags: [authoring, docs, onboarding]
---

# US-304: Authoring Guide

## User Story

**As a** doc author
**I want to** a tutorial that walks me through my first SemText document
**So that** I learn the vocabulary by building, not by reading a reference cover to cover.

## Acceptance Criteria

- **Given** the spec is reference-shaped (known gap)
  **When** a newcomer opens the authoring guide
  **Then** they produce a small valid document (facts, a view, a note) in one sitting,
  validated with `semtext-validate` (US-301).
- **Given** each element introduced
  **When** it appears in the guide
  **Then** the guide's example uses the canonical tag form (v0.5), not the Appendix A
  class alias.

## Notes

The tutorial the spec is explicitly not (P-001 frustration). Small effort, high funnel
value once a validator exists to keep it honest.
