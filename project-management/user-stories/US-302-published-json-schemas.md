---
id: US-302
title: "Published, versioned JSON Schemas; validator reads the spec's schemas"
slug: published-json-schemas
personas: [P-001, P-008, P-005]
epic: "E3 Authoring & Validation"
priority: must-have
complexity: medium
tags: [validation, schemas, spec]
---

# US-302: Published, Versioned JSON Schemas

## User Story

**As a** content platform owner
**I want to** the vocabulary's JSON Schemas published under `spec/schema/` and versioned with the spec
**So that** validation is checkable against a normative artifact, not prose.

## Acceptance Criteria

- **Given** a spec release (v0.5)
  **When** the schemas ship
  **Then** they are versioned alongside it, addressable per version, and published.
- **Given** the validator (US-301)
  **When** it checks an element
  **Then** it reads these same schemas — one source of truth, no second vocabulary
  encoding in the tool.
- **Given** a spec version bump
  **When** schemas change
  **Then** the change is diffable (this is also P-005's v0.6 prerequisite).

## Notes

In flight on the 2026-10-07 validation thread. W0's `sem-audiences.md` and the six
Tier-0 schema docs are the seed material.
