# project-management/

Product-management artifacts for SemText, generated from the UXE review of 2026-10-07
(spec v0.5, develop f295847). Formats follow the UXE product-management-artifacts spec.
Forward planning lives in [`../ROADMAP.md`](../ROADMAP.md) (v2, same date).

**Honesty note:** these personas are inferred from the codebase and its history, not
from user research. P-008 (Content Platform Owner) is explicitly a hypothesis persona.
A11y metrics in E6 are validation questions, not projections.

## Personas — `personas/` (8)

| ID | Name | Segment | Anchors |
|---|---|---|---|
| [P-001](personas/P-001-doc-author.md) | Doc Author | primary | E3 authoring/validation |
| [P-002](personas/P-002-llm-agent.md) | LLM Agent | primary | E4 agent surface |
| [P-003](personas/P-003-human-reader.md) | Human Reader | primary | E2 themes, E6 print/keyboard |
| [P-004](personas/P-004-framework-integrator.md) | Framework Integrator | secondary | E5 onboarding/distribution |
| [P-005](personas/P-005-spec-steward.md) | Spec Steward | secondary | E1 hygiene, US-503 spec versioning |
| [P-006](personas/P-006-accessibility-first-reader.md) | Accessibility-first Reader | edge-case | E6 keyboard/print/motion |
| [P-007](personas/P-007-js-off-low-bandwidth-reader.md) | JS-off / Low-bandwidth Reader | edge-case | E6 degradation must-haves |
| [P-008](personas/P-008-content-platform-owner.md) | Content Platform Owner | secondary (**hypothesis — unvalidated**) | E3 adoption gate, E5 funnel |

Full list: [`personas/index.yaml`](personas/index.yaml)

## User stories — `user-stories/` (34, MoSCoW 14/14/5)

| Epic | Wave | Stories |
|---|---|---|
| E1 Hygiene & Release Integrity | Sprint 0 | US-101…105 (5) |
| E2 W3 Reader Themes — **gated on Track T** | W3 (parked) | US-201…205 (5) |
| E3 Authoring & Validation — the adoption gate | W4 (recommended primary) | US-301…308 (8) |
| E4 Agent Surface | W5 (after W4) | US-401…405 (5) |
| E5 Onboarding & Distribution | W6 (after W4) | US-501…505 (5) |
| E6 Accessibility & Degradation | slot-any | US-601…605 (5) |

Full list: [`user-stories/index.yaml`](user-stories/index.yaml)

## Status of stories already in flight (2026-10-07)

| Stories | Executing |
|---|---|
| US-101, US-103, US-104, US-105 | hygiene thread |
| US-102, ROADMAP v2 | this thread |
| US-601, US-602 | JS-off thread |
| US-301, US-302 | validation thread |

Everything else is planned, not started. US-201…205 remain gated on Track T.

## Persona ↔ story coverage

| Persona | Stories |
|---|---|
| P-001 | US-301–306, US-501 (7) |
| P-002 | US-401–405 (5) |
| P-003 | US-201–204, US-205, US-604, US-605 (7) |
| P-004 | US-405, US-501, US-502, US-504, US-505 (5) |
| P-005 | US-101–105, US-203, US-302, US-503 (8) |
| P-006 | US-201, US-202, US-204, US-601, US-603, US-604, US-605 (7) |
| P-007 | US-601, US-602, US-603 (3) |
| P-008 | US-101, US-105, US-301, US-302, US-303, US-305, US-402, US-501, US-502, US-503, US-504 (11) |
