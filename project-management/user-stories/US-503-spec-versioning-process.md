---
id: US-503
title: "Spec versioning process: v0.6 changelog, resolved §10, compat rules"
slug: spec-versioning-process
personas: [P-005, P-008]
epic: "E5 Onboarding & Distribution"
priority: should-have
complexity: medium
tags: [spec, versioning, process]
---

# US-503: Spec Versioning Process

## User Story

**As a** spec steward
**I want to** a documented versioning process — changelog, resolved §10 questions, compatibility rules — exercised by cutting v0.6
**So that** adopters can upgrade on published rules instead of reading every diff.

## Acceptance Criteria

- **Given** spec §10's open questions (finding F4)
  **When** v0.6 is cut
  **Then** each is resolved or explicitly deferred with a reason — none silently carried.
- **Given** the v0.6 release
  **When** a v0.5 document is checked against it
  **Then** a written compatibility statement says what changed, what is additive-safe,
  and what (if anything) breaks.
- **Given** the process document
  **When** the next version is proposed
  **Then** the steps (proposal → schemas → changelog → migration notes) are repeatable.

## Notes

UC-10. Also closes the ROADMAP open-decision row for "Spec §10 + v0.6 process".
Unblocks P-008's "will this project strand me?" test.
