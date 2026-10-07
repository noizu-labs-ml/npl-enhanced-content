---
id: P-002
name: "LLM Agent"
slug: llm-agent
archetype: "Coding/doc agent consuming XHTML as a structural record"
segment: primary
tags: [agent, extraction]
---

# P-002: LLM Agent

## Demographics

| Attribute | Value |
|-----------|-------|
| Age | — |
| Occupation | Automated coding / documentation agent (LLM-driven harness) |
| Location | Runs wherever its operator runs it |
| Tech comfort | high (programmatic consumer) |

## Bio

An agent that ingests documentation as part of coding or answering tasks. It does not
"read" a browser rendering — it consumes structure. For it, the XHTML document *is* the
API: elements, attributes, and a plain-text fallback it can tokenize cheaply.

## Goals
- Lossless extraction: the record it builds must not silently drop content the human
  reader sees.
- Plain-text parity: a text rendering that costs tokens, not a DOM walk.
- An extraction contract it can rely on across spec versions.

## Frustrations
- The extraction contract is undocumented: the round-trip invariant
  E(D) = E(R(D)) = E(I(R(D))) is tested in the repo but not published in the spec
  (§8) as a promise.
- No per-document plain-text representation linked from served pages — it must
  re-derive what the page already knows.

## Behaviors
- Trusts machine-checkable statements (schemas, invariants, test suites) over prose.
- Fails loudly on ambiguity; silently invents structure when documents are malformed.

## Job to Be Done
> "When I ingest a document, I want unambiguous structure and a plain-text fallback, so
> extraction is lossless and cheap."

## Relationship to Product

Half the founding thesis ("XHTML replaces Markdown" — machine-readable by default).
The repo's own extraction-invariant suite is the real evidence this persona's needs are
already served internally; the gap is that the promise is not published (UC-2).

## Scenarios
- **Scenario 1: Ingest a served spec** — the agent fetches a SemText page, follows a
  `llms.txt` link to the plain-text representation, and extracts structure with the
  published invariant as its correctness argument (US-401, US-402).
- **Scenario 2: Programmatic pipeline** — a build step runs `semtext extract` headlessly
  over a corpus and fails the build if extraction is not idempotent (US-404, US-405).
