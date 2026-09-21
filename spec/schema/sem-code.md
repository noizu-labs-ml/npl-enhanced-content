# Schema — `sem-code`

Contract per conventions.md v0.5. BDD source of truth for
`test/e2e/sem-code.cy.js`. Changes here precede spec changes precede code.

## Scope semantics

A source listing with provenance. The element exists because plain
`<pre><code>` cannot carry a filename, a language, or a set of emphasised
lines that a machine can read back, and because copy / wrap are reading
affordances that need JS. The listing itself is **verbatim**: whitespace
inside `<code>` is content, never normalised.

## Authoring form

```html
<sem-code id="c-rotate" lang="ts" filename="src/rotate.ts" mark="2,4-5" controls="copy,wrap">
<pre><code>export function rotate(pair: Pair): Pair {
  const next = mint();
  retire(pair.refresh);
  return next;
}</code></pre>
</sem-code>
```

Class-form alias (conventions Appendix A): `div.sem-code[data-lang][data-filename][data-mark][data-wrap][data-controls]`
with the same `<pre><code>` child. Parameters are read as `data-<name>`
first, then bare `<name>`.

- Child: **exactly one `<pre>`**, conventionally wrapping one `<code>`. The
  listing is the `<code>`'s text (the `<pre>`'s when no `<code>` is
  authored).
- `lang` (optional): language token, rendered as a badge.
- `filename` (optional): provenance label.
- `mark` (optional): emphasised lines, 1-based, comma list of numbers
  and `a-b` ranges (`2,4-5`). Out-of-range entries are ignored.
- `wrap` (boolean, optional): start with soft-wrapped lines.
- `controls` (optional): comma flags from `copy`, `wrap`; default
  `copy`. Unknown flags are ignored.
- `id`, `kind`, `tags`, `audience` per the global catalog.

## Rendered form

### Fallback (reading bundle, `dist/semtext-reading.js`)

- `.sem-code-chrome` is inserted as the element's **first child**: filename
  (`.sem-code-filename`), language badge (`.sem-code-lang`), then the
  control buttons in `controls` order — `button[data-act="copy"]` and
  `button[data-act="wrap"][aria-pressed]` — and a `.sem-code-status` live
  region.
- Lines are wrapped: every line of the listing becomes
  `span.sem-code-line`; a marked line becomes `mark.sem-code-line`. Line
  wrapping keeps the `<code>` text **byte-identical** (`\n` text nodes
  between spans) so the listing reads back unchanged. A `<code>` that
  already contains element children (author-side highlighting) is left as
  authored and only the chrome is added.
- Copy writes the listing to the clipboard (Clipboard API, falling back to
  `execCommand('copy')` on a selection); the status region announces
  `Copied`. When neither mechanism exists the copy button is not rendered.
- Wrap toggles `data-wrap` on the element; the button reflects it through
  `aria-pressed`.
- The `<pre>` receives `tabindex="0"` when it overflows horizontally, so a
  keyboard reader can scroll it.
- The element carries `data-sem-fallback` once wired.

### Upgraded (Lit `SemCode`)

- Thin wrapper: on connect, claims `data-sem-upgraded` and clears
  `data-sem-fallback`; once its `<pre>` child exists it calls the same
  enhance function the bundle uses. The function is idempotent — chrome
  already present means nothing is added twice — so a document that runs
  both scripts, in either order, renders one chrome.

### JS-off

- Plain `<pre>`; the filename renders as a caption through
  `::before { content: attr(filename) }` (either spelling); the language badge likewise.
- No chrome, no line marks (they are runtime spans), nothing hidden.
- Print: `white-space: pre-wrap` so long lines do not clip.

## Events

None.

## A11y contract

- Control buttons are real `<button type="button">` elements with visible
  text labels; the wrap toggle carries `aria-pressed`.
- `.sem-code-status` is `role="status"` (`aria-live="polite"`), so a copy
  is announced without moving focus.
- An overflowing `<pre>` is focusable (`tabindex="0"`) and labelled with
  the filename (or `code`) via `aria-label`, so keyboard users can reach
  and scroll it.
- Marked lines use `<mark>` — an announced, semantic emphasis, not colour
  alone.

## Machine contract

- `fields: { lang, filename, marks: number[], source }`.
  - `lang` / `filename`: attribute strings, `""` when absent.
  - `marks`: the parsed, expanded, ascending line numbers.
  - `source`: the listing **verbatim** — the `<code>` text content with
    its whitespace intact. This is a recorded exception to the "text is
    normalised" rule (like `sem-progress`'s derived text): a listing whose
    indentation was collapsed would be a different program.
- `text` = the normalised single-line form of the source (whitespace runs
  collapsed), so consumers that only read `text` still get the content.
- The annotated-text renderer emits `source` as an indented block under
  the record head instead of repeating the normalised text.
- `.sem-code-chrome`, `.sem-code-status` are chrome and never contribute
  text; `.sem-code-line` spans and `<mark>` are read through.
- `data-wrap` is presentation; not extracted.
