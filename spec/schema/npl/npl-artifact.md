# Schema — `npl-artifact`

A structured output block with metadata — the display of an NPL artifact
(Lit `NplArtifact`, `src/lit/npl/npl-artifact.ts`). Display-only: no
events, no state; the authored children carry the data and the upgrade
turns them into display chrome in place.

## Authoring form

```html
<npl-artifact type="code">
  <title>Q3 revenue breakdown</title>
  <content>def q3(): return rows("2026-Q3")</content>
</npl-artifact>
```

Class-form alias (conventions Appendix A, npl namespace):
`.npl-artifact[data-type]` with `.npl-title` / `.npl-content` part twins
(the bare-tag / class pair mirrors `sel`/`part`, src/shared/sel.ts).

- `type`: string — default `` (unset). A content type such as `text`,
  `code`, `svg`, `markdown`. `svg` routes the content through a
  sandboxed iframe; every other value (including unset) renders the
  content preformatted. Mirrored to `data-type` (dual-form contract;
  the mirror is deferred past parse via afterParse).
- `id`, `kind`, `tags` per the global attribute catalog — no bullet needed.

Children: `title` and `content` — bare tags or class aliases; the
enhancement preserves their authored inner nodes.

## Rendered form

- Enhanced: `<npl-artifact>` itself (Lit `NplArtifact` — light DOM, no
  shadow root). Generated chrome (`.npl-artifact-<part>`):
  - title → `<h3 class="npl-artifact-title">` heading;
  - content → `<pre class="npl-artifact-content">` for every non-`svg`
    type (preformatted text, searchable and copyable);
  - content → `<iframe class="npl-artifact-svg" sandbox="" srcdoc>` for
    `type="svg"`. The markup is never inlined — untrusted SVG can carry
    `<script>` or event-handler attributes — and the empty `sandbox`
    attribute is the strictest setting: no scripts, no same-origin, no
    forms, no popups.
- JS-off: the block box from the npl section of `themes/_vocabulary.css`
  (`npl-artifact, .npl-artifact { display: block; }`). Nothing hidden,
  nothing generated — the authored title and content read as plain
  prose.
