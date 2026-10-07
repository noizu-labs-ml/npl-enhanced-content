---
id: US-308
title: "Implement md-aid (tier-2)"
slug: implement-md-aid
personas: [P-001]
epic: "E3 Authoring & Validation"
priority: should-have
complexity: medium
tags: [tier-2, vocabulary]
---

# US-308: Implement md-aid

## User Story

**As a** doc author
**I want to** the remaining tier-2 element `md-aid` implemented
**So that** the vocabulary's spec surface matches what the runtime ships.

## Acceptance Criteria

- **Given** the schema + BDD spec for `md-aid`
  **When** implementation lands
  **Then** both tiers asserted, extraction defined, and its budget line added to
  ROADMAP's budget table (the reading bundle is at 19.5 KB — any growth here is
  deliberate and recorded).
- **Given** scripts stripped
  **When** it renders
  **Then** content stays readable (invariant 6).

## Notes

Tier-2 follow-on to US-307; watch the reading-bundle budget, which is at its line.
