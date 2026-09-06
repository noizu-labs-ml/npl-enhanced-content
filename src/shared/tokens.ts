/**
 * tokens — comma/space separated attribute lists.
 *
 * One parser for every list-valued attribute in the vocabulary:
 * `tags`, `data-npl-controls`, `data-npl-audience`, `implies`.
 * Order is preserved (author order is meaningful for `implies`);
 * empties are dropped and duplicates collapse to their first occurrence.
 */

const SEPARATORS = /[,\s]+/;

/** Parse a raw attribute value into an ordered, de-duplicated token list. */
export function parseTokens(value: string | null | undefined): string[] {
  if (value == null) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of value.split(SEPARATORS)) {
    const token = raw.trim();
    if (token === '' || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

/** Parse an attribute off an element. Missing attribute → empty list. */
export function elementTokens(el: Element, attr: string): string[] {
  return parseTokens(el.getAttribute(attr));
}
