---
id: P-001
name: "Doc Author"
slug: doc-author
archetype: "Long-form spec writer using SemText as her single source"
segment: primary
tags: [authoring, long-form]
---

# P-001: Doc Author

## Demographics

| Attribute | Value |
|-----------|-------|
| Age | 30s |
| Occupation | Technical writer / docs maintainer (staff-level) |
| Location | Remote, English-language docs teams |
| Tech comfort | high |

## Bio

A technical writer who maintains long-form specification and architecture documents. She
has lived through the Markdown-plus-rendered-view maintenance trap and wants one source
of truth. She found SemText through the XHTML-replaces-Markdown thesis and is evaluating
whether she can bet a real document set on it.

## Goals
- Author from a single source that already carries reading affordances — no parallel
  Markdown and rendered views to keep in sync.
- Produce documents that are *valid*: she wants a machine answer to "is this well-formed
  SemText v0.5?" before anyone else sees it.
- Editor support that does not require memorizing the whole vocabulary.

## Frustrations
- No validation tooling exists (repo finding F5): today she can only learn she made a
  mistake when the rendering looks wrong.
- The spec is a reference, not a tutorial — there is no "your first document" path.
- The vocabulary is growing (W0–W2.2 shipped five elements) and she cannot tell which
  parts are stable.

## Behaviors
- Works in a real editor with lint-on-save expectations; treats CI as the quality gate.
- Reads specs before code, and bails quickly when a spec contradicts itself.
- Copies the demo document and edits it, rather than starting from a blank file.

## Job to Be Done
> "When I write a spec, I want semantic structure with reading affordances built in, so
> I stop maintaining parallel Markdown + rendered views."

## Relationship to Product

Primary producer of the artifact the whole format exists for. If she cannot validate her
output, SemText stays a demo and she stays on Markdown. Use cases UC-1 (author and
iterate to valid v0.5) and UC-9 (migrate a Markdown corpus in) are hers.

## Scenarios
- **Scenario 1: First real document** — she drafts an architecture spec in SemText,
  wants `semtext-validate` to catch a mistyped `view-as` value with a file:line error
  before she commits (US-301, US-302, US-304).
- **Scenario 2: Corpus migration** — she converts an existing Markdown handbook into
  SemText with the converter's help, and needs it to flag the passages that need a manual
  pass (US-305).
