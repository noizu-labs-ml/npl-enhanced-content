# Schema — `npl-details` / `npl-detail` / `highlight`

Contract per conventions.md v0.4. BDD source of truth for
`cypress/e2e/npl-details.cy.js`. Changes here precede spec changes
precede code.

## Scope decision (recorded)

Three candidate readings existed for `npl-details`; this schema adopts the
**PRD §5 catalog reading — prose passage with occludable content**:

1. **Adopted**: container of `npl-detail` prose passages whose
   `span.npl-highlight` children mark cloze/recall targets;
   `data-view-as="quiz"` occludes them (the universal `<highlight>` cloze,
   PRD §4 rule 3). The demo prototype (demo/index.html) already implements
   this — M3 formalizes it.
2. *Rejected — collapsible detail block*: `npl-reveal` already owns
   Q→A disclosure (`<details>`/`<summary>`); a second collapsible block
   would duplicate its mechanism and BDD.
3. *Rejected — accordion group of reveal-like items*: overlaps
   `npl-reveal` (disclosure semantics) and `npl-views` (mutually-exclusive
   visibility + named switching). An accordion adds a third sibling/
   sibling-hiding mechanism without new semantics.

`npl-details` is therefore **recall-oriented prose**, distinct from
`npl-reveal` (block disclosure) and `npl-views` (perspective switching):
same prose, different interaction model per view.

## Authoring form (v0.4 class-based)

```html
<div class="npl-details" id="oidc-details" data-view-as="quiz">
  <div class="npl-detail">
    The OIDC token travels in the
    <span class="npl-highlight">Authorization</span> header.
  </div>
</div>
```

- `data-view-as`: `plain` (default) | `quiz`. Display-only sugar — the
  prose is identical; quiz view additionally occludes highlights.
- `.npl-detail`: one prose passage; any inline content, `span.npl-highlight`
  marks a recall target. `[[cloze]]` sugar maps to `span.npl-highlight`.
- `id` on the container; `kind`, `tags` global. Facts may also carry
  `npl-highlight` prompts (schema npl-facts), but occlusion wiring for
  prose lives here.

## Rendered form (v0.4)

- `plain` (default): highlights render emphasized (`.npl-highlight` —
  accent-tinted, non-italic-safe inline emphasis). No JS needed, no
  fallback marker.
- `quiz`: fallback JS replaces each `.npl-highlight` with an occluded
  span (`.npl-occluded`): text masked (background chip, transparent
  color), `role="button"`, `tabindex="0"`, `aria-label="reveal"`.
  Container gets `data-sem-fallback`; hide/mask rules key off it.
- Reveal: click or Enter/Space on the occluded span → becomes
  `.npl-highlight .npl-revealed` (readable, accent-tinted), loses
  `role`/`tabindex`. Reveals are per-item and irreversible (self-check
  model).
- Lit upgrade (`<npl-details>` element) supersedes: sets
  `data-sem-upgraded`, removes `data-sem-fallback`, performs the same
  occlusion imperatively in light DOM.

## JS-off behavior

- Both views fully readable: highlights stay visible emphasized. No
  occlusion, no hidden content, no fallback marker.

## Events

None (self-check reveals are local). Sequencing (`npl-details` full:
guided item-by-item recall) is Tier-1.

## A11y contract

- Occluded span is a keyboard-operable button (`role="button"`,
  `tabindex="0"`, `aria-label="reveal"`); Enter/Space reveal; focus is
  preserved on reveal (the span is replaced in place — replaceWith keeps
  focus on the new node when it is the same position; tests assert
  content visibility, not focus).
- JS-off: nothing occluded, so no hidden-content AT hazard.

## Machine contract

- Extractable as `[{container, passage, cloze: [strings]}]` — each
  highlight is a recall target the reader must produce. In quiz context a
  document's highlights + the matching facts form the recall key set;
  `view-as` never changes extraction.
