---
id: US-501
title: "Interactive playground: edit source, see three-tier live render"
slug: interactive-playground
personas: [P-008, P-004, P-001]
epic: "E5 Onboarding & Distribution"
priority: must-have
complexity: high
tags: [onboarding, playground, site]
---

# US-501: Interactive Playground

## User Story

**As a** content platform owner evaluating SemText
**I want to** a playground where I edit source and see the three tiers render live
**So that** I can try the format hands-on before committing to an evaluation spike.

## Acceptance Criteria

- **Given** the site's playground page
  **When** source is edited
  **Then** fallback, reading, and extraction outputs all update live (three-tier
  rendering, not just the pretty tier).
- **Given** invalid input
  **When** it renders
  **Then** the playground shows the validator's error (US-301) — the playground is
  powered by the validator, which is why this story depends on W4.
- **Given** a shared example snippet
  **When** loaded
  **Then** it round-trips (edit → render → source shows the same semantics).

## Notes

UC-7's funnel leak ("no playground") closes here. Sequencing: after W4 — a playground
without a validator is a demo of failures (ROADMAP sequencing argument).
