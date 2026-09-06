# Project Architecture — npl-enhanced-content

## Overview

npl-enhanced-content defines an XHTML-first rich-content format for NPL
(Noizu Prompt Lingua): documents that are simultaneously human-readable styled
HTML, structurally parseable data for LLMs/agents, and terminal-extractable
text. One file, three consumers. The repo is **spec-first** — tier-0 specs in
`syntax/` precede implementation code, with the Lit `SemNote` component +
standalone demo and cypress e2e currently shipping.

→ *Repo tree: [PROJ-LAYOUT.md](PROJ-LAYOUT.md) · data contract: [PROJ-SCHEMA.md](PROJ-SCHEMA.md)*

## System Diagram

```mermaid
graph LR
    A[Author] -->|writes| S["syntax/ specs (conventions.md, schema/sem-note.md)"]
    S -->|governs| D["Enhanced XHTML doc<br/>(class-based v0.4 / sem-* elements)"]
    D --> B["Browser: core CSS + Tailwind CDN + fallback JS"]
    D --> L["Lit 3 upgrade (SemNote, light DOM)"]
    D --> M["LLM/agent: structural read<br/>(attrs qualify every datum)"]
    D --> T["Terminal: DOM-text extraction"]
    C["demo/index.html"] -.reference impl.-> D
    E["cypress e2e"] -.validates.-> C
    E -.BDD mirrors.-> S
```

## Core Components

| Component | Purpose |
|-----------|---------|
| Tier-0 specs (`syntax/`) | Authoring conventions (v0.4 class-based baseline) + `sem-note` element schema; BDD source of truth |
| Class-based vocabulary (v0.4) | Identity = `sem-*` classes on plain elements, parameters = `data-*` attrs; mechanical map to future custom elements |
| `sem-fallback` handler | ~2–4KB inline vanilla JS: view-as switching, reveal toggles, highlight occlusion, quiz checking, theme picker — zero external resources for baseline interactivity |
| Lit components (`SemNote` first) | Upgrade elements in place; supersede fallback; light-DOM content, shadow DOM chrome only; handoff via `data-sem-fallback` attr |
| Theme layer | `data-sem-theme` on `<html>`, `--sem-*` tokens, TRP-YAML-compiled CSS, 4 TRP ports, zero-JS theme flips |
| Standalone demo (`demo/index.html`) | Reference implementation of the v0.4 baseline (single file: core CSS + Tailwind `@apply` layer + fallback JS) |
| Cypress e2e (`cypress/`) | Validates demo behavior; mirrors the `sem-note` schema BDD |

→ *Components ↔ directories: see [PROJ-LAYOUT.md](PROJ-LAYOUT.md)*

## Degradation & Rendering Tiers

1. **JS-off**: `sem-*:not(:defined)` theme CSS — accent borders, variant labels, presentable, no layout shift on upgrade.
2. **Fallback**: embedded vanilla handler provides full baseline interactivity (Lit-free single-file form works).
3. **Upgraded**: Lit components register, remove `data-sem-fallback`, own behavior.

Content always lives in light DOM (searchable/copyable); shadow DOM carries interactive chrome only.

## Distribution Forms

Folder (`doc.html` + relative `semtext/`), single-file (everything inlined), MHTML.
Hard rules: no ES-module scripts in portable docs, no runtime fetch, fallback always embedded.

## Key Decisions

- **XHTML-first canonical**: the doc itself is the data; no preprocessing layer in v0.4 — attributes canonical, inline NPL notation is sugar.
- **Class-based v0.4 baseline** (over custom elements) so documents render styled without a build step; custom elements remain the Lit-milestone target vocabulary.
- **Three-consumer model**: same file serves browser, LLM, and terminal — machine-readability contract (semantic children + qualifying attrs) is part of the format, not an export step.
- **NPL XML-variant alignment**: this vocabulary is the document-shaped rendering target of NPL's existing XML/MCP vocabulary; mapping to NPL agent/fact schemas is tracked (Q4: this repo publishes the schema file, NPL MCP consumes).
- **Spec → spec → code change order**: `syntax/schema/sem-note.md` precedes conventions precedes implementation precedes cypress.

## Monorepo Role

NPL-ecosystem spec + JS demo submodule; couples to the NPL framework
(`Portfolio/Apps/AI/NoizuPromptLingo`) and Libs Lit components.
