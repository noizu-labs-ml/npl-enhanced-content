/**
 * summary — the one derived-summary rule, shared by render and extraction.
 *
 * `spec/schema/sem-reveal.md`: when `data-summary` is absent the summary is
 * the first line of the body, at most 60 characters. Extraction has
 * implemented that rule since it existed; the fallback used to render a
 * different string (first eight words plus an ellipsis). Both now call this
 * function, so the `<summary>` a reader sees is the `summary` a machine
 * receives — the divergence recorded in spec/extraction.md §4 is closed.
 *
 * Pure. The caller normalizes whitespace first (`normalize`), so the cut
 * point is a function of the text alone and survives the fallback's
 * `<details>` rewrite unchanged.
 */

/** Collapse whitespace runs to one space and trim. */
export function normalize(text: string | null | undefined): string {
  return (text || '').replace(/\s+/g, ' ').trim();
}

/**
 * Leading run of `body`, at most 60 characters, cut at the last word
 * boundary, trailing punctuation dropped, no ellipsis.
 */
export function deriveSummary(body: string): string {
  if (body.length <= 60) return body;
  const cut = body.slice(0, 60);
  const sp = cut.lastIndexOf(' ');
  return (sp > 0 ? cut.slice(0, sp) : cut).replace(/[\s,;:.—-]+$/, '');
}
