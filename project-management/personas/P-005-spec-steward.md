---
id: P-005
name: "Spec Steward"
slug: spec-steward
archetype: "Maintainer evolving the vocabulary and versioning the spec"
segment: secondary
tags: [spec, versioning]
---

# P-005: Spec Steward

## Demographics

| Attribute | Value |
|-----------|-------|
| Age | 30s–40s |
| Occupation | Open-source maintainer / spec owner (SemText core team) |
| Location | Remote |
| Tech comfort | high |

## Bio

The person accountable for the format itself: conventions.md, the schemas, the BDD
discipline, and what "v0.6" will mean. She runs the repo's process — PRs, budgets,
release integrity — and feels every inconsistency in the project's public surface as
her own bug.

## Goals
- Cut versioned, diffable spec releases with changelogs and compatibility rules.
- Keep the project's artifacts honest: version labels, roadmap status, served builds
  all agree with reality.
- Close the spec's own open questions (§10) rather than accumulating them.

## Frustrations
- No v0.6 process exists and spec §10 Open Questions are unresolved (repo finding F4) —
  the format is stuck at v0.5 by process, not by design.
- Artifacts drift (stale demo label, stale roadmap status) faster than she can sweep
  them by hand.

## Behaviors
- Re-baselines openly when reality diverges from plan (see M1, M2 history in ROADMAP).
- Prefers guardrails (budgets, CI gates) over vigilance.

## Job to Be Done
> "When I release a spec change, I want a versioned, diffable release with compatibility
> rules, so adopters can upgrade without fear and I can evolve without breaking them."

## Relationship to Product

Owns UC-10 (cut spec v0.6: resolved §10, changelog, migration notes) and the E1 hygiene
epic. She is the repo's own team wearing its process hat.

## Scenarios
- **Scenario 1: Cut v0.6** — she resolves §10 questions, writes the changelog and
  migration notes, and publishes versioned JSON Schemas alongside the spec (US-503,
  US-302).
- **Scenario 2: Release integrity sweep** — before a release she confirms the demo's
  version stamp, the roadmap status, and the remote main state all agree (US-101,
  US-102, US-103).
