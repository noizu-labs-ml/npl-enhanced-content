---
id: P-004
name: "Framework Integrator"
slug: framework-integrator
archetype: "Developer embedding semtext*.js into a host site"
segment: secondary
tags: [integration, bundles]
---

# P-004: Framework Integrator

## Demographics

| Attribute | Value |
|-----------|-------|
| Age | 25–40 |
| Occupation | Frontend/full-stack developer on a docs or product site |
| Location | Anywhere |
| Tech comfort | high |

## Bio

A developer whose job is to add capabilities to an existing site without rewriting it.
She evaluates libraries by "how long until my first working integration" and abandons
anything that costs a day of reading source.

## Goals
- Integrate SemText's bundles with three script tags and sane defaults — an afternoon,
  not a sprint.
- Understand which of the five bundles (`fallback`, `reading`, `extract`, `md`, Lit)
  her page needs and what each costs in bytes.
- Theme the result to match her site without forking the CSS.

## Frustrations
- No integration guide: themes ship, but there is no documented quickstart walking the
  script tags, the fallback-first order, and the theme link (repo finding on UC-5).
- Budget numbers live in ROADMAP.md, not in consumer-facing docs.

## Behaviors
- Copies a working snippet before reading any spec.
- Checks network tab and bundle size before adopting anything.

## Job to Be Done
> "When I add SemText to my stack, I want three script tags and sane defaults, so
> integration is an afternoon."

## Relationship to Product

Distribution surface. The bundles are built and budgeted; what is missing is the
documentation wrapper (UC-5, US-502) and the playground that lets her try before she
integrates (UC-7, US-501).

## Scenarios
- **Scenario 1: First embed** — she follows a quickstart: fallback core, reading bundle,
  theme CSS, one demo document — and has a working page in under an hour (US-502, US-501).
- **Scenario 2: Sizing the dependency** — she checks the per-bundle byte budgets against
  her own performance budget and picks exactly the bundles she needs (US-505).
