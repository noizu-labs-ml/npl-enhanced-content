# Schema — `sem-md`

Contract per conventions.md v0.4. BDD source of truth for
`test/e2e/sem-md.cy.js`. Changes here precede spec changes precede code.

## Scope semantics

A block whose content is authored as **Markdown** and rendered to HTML in
the browser. The element exists for the one kind of content that is
cheaper to write as Markdown than as HTML and that a machine wants back as
Markdown: tables above all, then headings, lists, emphasis, links, code and
quotes. It is not a second authoring format for the vocabulary — a
`sem-fact` is still written as a `sem-fact` — and it never fetches, never
evaluates and never injects markup: the renderer builds DOM nodes from the
parsed text, so anything that looks like HTML inside the Markdown is
rendered as the characters that were typed.

Minting justification (conventions): a field (`source`, the Markdown), an
interaction (rendered / raw toggle, copy) and a degradation behaviour (the
raw Markdown shows as readable preformatted text with JS off).

## Authoring form

Class form (v0.4):

```html
<div class="sem-md" id="m-lifetimes" data-label="Token lifetimes" data-controls="toggle,copy">
  | Token   | Lifetime | Rotates |
  | :------ | -------: | :-----: |
  | access  | 15 min   | no      |
  | refresh | 30 days  | yes     |
</div>
```

Element form: `<sem-md label view-as controls>` with the same text child.
Parameters are read as `data-<name>` first, then bare `<name>`.

- Content: the element's **text** is the Markdown. Authors indent freely:
  the common leading whitespace of the non-blank lines is stripped and
  leading / trailing blank lines are dropped (**normalised source**). The
  document is still HTML, so `<` and `&` in the Markdown are written
  `&lt;` and `&amp;`; entities decode before parsing.
- `data-view-as` (optional): `rendered` (default) or `raw` — the initial
  mode. **Mutable presentation attribute**: the toggle rewrites it at
  runtime and extraction ignores it (spec/extraction.md §5c).
- `data-label` (optional): a short caption rendered in the chrome.
- `data-controls` (optional): comma flags from `toggle`, `copy`; default
  both. Unknown flags are ignored.
- `id`, `kind`, `tags`, `audience` per the global catalog.

### Markdown dialect

A fixed subset, parsed by `src/md/parse.ts` (no dependency, no HTML
pass-through):

| Block | Syntax |
| :-- | :-- |
| heading | `#` … `######` + space |
| paragraph | consecutive non-blank lines; `  ` (two trailing spaces) or `\` at line end is a hard break |
| thematic break | `---`, `***`, `___` |
| block quote | `> ` prefix, nestable |
| list | `-`, `*`, `+`, `1.`, `1)`; nested by indentation; tight lists unwrap their paragraphs |
| fenced code | ```` ``` ```` or `~~~` with optional info string → `<pre><code class="language-x">` |
| table (GFM) | header row, delimiter row (`:--`, `--:`, `:-:` set alignment), body rows; `\|` escapes a pipe |

| Inline | Syntax |
| :-- | :-- |
| code span | `` `code` `` (any backtick run length) |
| strong / emphasis | `**` `__` / `*` `_` |
| strikethrough | `~~` |
| link | `[text](url "title")`; `javascript:`, `data:` and `vbscript:` URLs render as text |
| image | `![alt](src)`; same URL rule |
| escape | `\` before a punctuation character |

Raw HTML is **text**. Autolinks in angle brackets, footnotes, task lists,
setext headings and reference-style links are not parsed; they render as
their literal characters.

## Rendered form

### Fallback (Markdown bundle, `dist/semtext-md.js`)

- `.sem-md-chrome` is inserted as the element's **first child**: the label
  (`.sem-md-label`, when authored), then the controls in `data-controls`
  order — `button[data-act="toggle"][aria-pressed]` (visible text
  `Markdown`; pressed while the raw view shows) and
  `button[data-act="copy"][aria-label="Copy Markdown"]` — and a
  `.sem-md-status` live region.
- `.sem-md-body` follows: the rendered HTML. Tables are real `<table>`
  elements with `<thead>`, `<th scope="col">` and `<tbody>`; the GFM
  alignment row is honoured per column (`style.textAlign` on every cell).
  Links carry `rel="noopener"`.
- `.sem-md-raw` follows: the normalised Markdown inside a `sem-code`
  (`data-lang="markdown"`, `data-controls="copy,wrap"`), built once. Its
  copy / wrap chrome is `sem-code`'s own: the Markdown bundle borrows the
  reading bundle's `enhanceCodeElement` through its global when that
  script is on the page (the Lit wrapper imports it), so the listing code
  is never bundled twice. Without the reading bundle the fence is a plain
  `sem-code` (CSS caption, no buttons); the chrome's copy button still
  copies the source.
- The authored text nodes are consumed: after enhancement the element
  holds exactly chrome, body and raw fence. The normalised source lives in
  the fence's `<code>`, byte-identical to what the parser saw.
- `data-view-as` is normalised to `rendered` or `raw` on enhancement; the
  toggle flips it and mirrors the state on `aria-pressed`. CSS hides the
  fence in rendered mode and the body in raw mode — both hide rules are
  gated on the tier marker.
- Copy writes the normalised Markdown to the clipboard (Clipboard API,
  falling back to `execCommand('copy')`); the status region announces
  `Copied`. When neither mechanism exists the copy button is not rendered.
- The element carries `data-sem-fallback` once wired. The bundle skips any
  element already carrying `data-sem-upgraded`.

### Upgraded (Lit `SemMd`)

- Thin wrapper: on connect, claims `data-sem-upgraded` and clears
  `data-sem-fallback`; once the document has finished parsing (the content
  is text, so there is no child element to wait for) it calls the same
  enhance function the bundle uses. Idempotent on DOM state: chrome already
  present means nothing is built twice, whichever script ran first.

### JS-off

- The raw Markdown shows as readable preformatted text: the vocabulary CSS
  applies `white-space: pre-wrap` and a monospace face to an element that
  carries no tier marker. Nothing is hidden, nothing is generated; a
  reader sees the table as its pipe-delimited source.
- Print: the rendered body, no chrome, no fence.

## Events

None.

## A11y contract

- The toggle is a real `<button type="button">` with visible text and
  `aria-pressed` reflecting whether the raw view is showing.
- The copy button carries `aria-label="Copy Markdown"`.
- `.sem-md-status` is `role="status"` (`aria-live="polite"`); it is written
  only on copy, so it never spams.
- Rendered tables keep native semantics (`<th scope="col">`, `<caption>`
  never synthesised); rendered headings are real `h1`–`h6`, so a reader
  outline sees them.
- Rendered links are ordinary anchors; no link opens a new window.

## Machine contract

- `fields: { source }`.
  - `source`: the **normalised Markdown** — common indentation stripped,
    leading / trailing blank lines dropped, otherwise verbatim. Third
    recorded exception to the "text is normalised" rule (after
    `sem-progress` and `sem-code`): Markdown is whitespace-sensitive, so
    the record carries what a Markdown consumer can parse.
- `text` = the single-line normalised form of `source` (whitespace runs
  collapsed).
- The annotated-text renderer emits `source` as an indented block under
  the record head, exactly as `sem-code` does.
- `.sem-md-chrome`, `.sem-md-body` and `.sem-md-raw` (the fence and the
  `sem-code` inside it included) are chrome: they mint nothing and
  contribute no text. Extraction reads `source` from the fence when it
  exists and from the element's own text otherwise, applying the same
  normalisation, so a JS-off document and an enhanced one extract
  identically, in either view.
- `data-view-as` is presentation; not extracted.
