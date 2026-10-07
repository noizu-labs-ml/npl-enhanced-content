---
id: P-008
name: "Content Platform Owner"
slug: content-platform-owner
archetype: "Evaluator deciding whether a docs platform adopts SemText"

segment: secondary
tags: [adoption, evaluation]
---

> **Hypothesis persona — unvalidated.** P-008 is inferred from the codebase's adoption
> gap (no validator, no migration path, demo labeled v0.4, no playground), not from
> research on any real platform owner. Treat every story below her as a hypothesis the
> adoption waves must validate.

# P-008: Content Platform Owner

## Demographics

| Attribute | Value |
|-----------|-------|
| Age | 30s–50s |
| Occupation | Engineering/docs platform lead choosing a content format for a CMS or docs platform |
| Location | Anywhere |
| Tech comfort | high |

## Bio

The person who decides what format a documentation platform accepts from its authors.
She has been burned by rich formats that required a runtime to be readable, and by
Markdown's ceiling on structure. SemText's XHTML-replaces-Markdown thesis interests her
— if — it survives due diligence.

## Goals
- A validation story she can put in CI: an invalid document must fail the build with a
  file:line error, not ship and render oddly (UC-8).
- A migration path from her existing Markdown corpus (UC-9), even if best-effort.
- Evidence the project will not strand her: versioned spec, compatibility rules,
  changelogs.

## Frustrations
- No validator exists (repo finding F5) — the single biggest adoption blocker.
- No migration tooling: `sem-md` renders Markdown inside SemText, but nothing converts
  Markdown *into* the vocabulary.
- The evaluation funnel leaks: the demo self-labels "v0.4 baseline" while the spec is
  v0.5, and there is no playground to try the format hands-on (UC-7, findings F1).

## Behaviors
- Runs a two-week evaluation: landing → demo → spec → a spike document in her pipeline.
- Rejects or defers on the first broken promise she can document.

## Job to Be Done
> "When I evaluate adoption, I want a validation story and migration path from Markdown,
> so the pitch survives due diligence."

## Relationship to Product

The persona whose yes would convert SemText from a demo into an adopted format. She
anchors E3's validation stories (US-301–303, US-305), E5's onboarding surface
(US-501–505), and the funnel-hygiene work in E1 (US-101).

## Scenarios
- **Scenario 1: Due-diligence spike** — she wires `semtext-validate` into her corpus
  CI, feeds it a deliberately broken document, and confirms it fails with file:line
  errors and a CI exit code (US-301, US-302, US-303).
- **Scenario 2: The funnel walk** — she lands on the site, tries the playground,
  checks the version labels agree, and reads the migration story before deciding
  (US-501, US-504, US-101, US-305).
