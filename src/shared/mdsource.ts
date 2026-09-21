/**
 * mdsource — the one normalisation rule for `sem-md` text.
 *
 * Authors indent Markdown inside the element freely, so the element's raw
 * text is the Markdown plus whatever the surrounding HTML indented it by.
 * Render (src/md) and extraction (src/extract) both apply this function,
 * which is what makes the JS-off document and the enhanced one extract the
 * same `source` (spec/schema/sem-md.md, machine contract):
 *
 *   - CRLF → LF
 *   - the common leading whitespace of the non-blank lines is stripped
 *   - whitespace-only lines become empty
 *   - leading and trailing blank lines are dropped
 *
 * Everything else — trailing spaces (a hard break), inner blank lines,
 * fence contents — is kept verbatim.
 */
export function normalizeMd(raw: string): string {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  let min = Infinity;
  for (const l of lines) {
    if (!l.trim()) continue;
    const k = (/^[ \t]*/.exec(l) as RegExpExecArray)[0].length;
    if (k < min) min = k;
  }
  const out = lines.map((l) => (l.trim() ? l.slice(min) : ''));
  while (out.length && !out[0]) out.shift();
  while (out.length && !out[out.length - 1]) out.pop();
  return out.join('\n');
}
