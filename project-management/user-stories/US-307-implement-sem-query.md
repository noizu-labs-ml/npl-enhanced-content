---
id: US-307
title: "Implement sem-query (tier-2, spec'd unshipped)"
slug: implement-sem-query
personas: [P-001, P-003]
epic: "E3 Authoring & Validation"
priority: must-have
complexity: high
tags: [tier-2, vocabulary, spec-debt]
---

# US-307: Implement sem-query

## User Story

**As a** doc author
**I want to** the spec'd `sem-query` element implemented in both tiers
**So that** the spec stops promising an element the runtime does not ship (spec-debt, finding F7).

## Acceptance Criteria

- **Given** the schema + BDD spec for `sem-query`
  **When** implementation lands
  **Then** fallback and Lit tiers are both BDD-asserted (invariant 2), and extraction
  handles it (§3/§5 rules).
- **Given** a document using `sem-query`
  **When** scripts are stripped
  **Then** its content still renders as readable text (invariant 6).

## Notes

Tier-2 item moved out of M5 into E3/W4 (see ROADMAP M5 edits): it ships alongside the
validator wave so spec and runtime re-converge. Per invariant 5, schema + cypress spec
co-authored before code.
