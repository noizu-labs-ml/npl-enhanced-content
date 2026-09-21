/**
 * scripts/standalone-lib.mjs — pure helpers behind scripts/build-standalone.mjs.
 *
 * Kept free of filesystem side effects so test/unit/standalone.test.mjs can
 * exercise the nojs stripper and the spec-page copy without a build.
 */

/** Remove HTML comments. A comment is prose about markup, not markup: a
 *  literal `<script` inside one must neither be stripped nor counted. */
export function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

/** Remove whole <script> elements. A JS string cannot contain a literal
 *  `</script>` without breaking the surrounding HTML, so this is safe.
 *  The end tag allows ignored junk before `>` (`</script foo>`, and newlines
 *  count as whitespace), so match `\b[^>]*` rather than `\s*` — otherwise a
 *  script survives into the nojs artifact.
 *
 *  Comments are removed first, so a `<script` mentioned inside one cannot
 *  start a match that swallows real markup up to the next end tag (which
 *  once ate a spec page's <head>). An opener with no end tag is a build
 *  failure, not something to truncate around: the input is malformed and
 *  the artifact would be missing everything after it. */
export function stripScripts(html) {
  let out = stripComments(html);
  // Removing one pair can reveal another, so run to a fixed point rather
  // than single-pass.
  let prev;
  do {
    prev = out;
    out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, '');
  } while (out !== prev);
  const orphan = out.match(/<script\b[^>]*>/i);
  if (orphan) {
    const line = out.slice(0, orphan.index).split('\n').length;
    throw new Error(`unclosed <script opener at line ${line}: ${orphan[0]}`);
  }
  // This artifact exists to prove the document reads with scripts off, so a
  // survivor is a build failure, not a warning.
  if (/<script/i.test(out)) {
    throw new Error('nojs artifact still contains <script after stripping');
  }
  return out.replace(/\n{3,}/g, '\n\n');
}

/** Every RELATIVE asset a spec page links, as repo-relative paths. Only real
 *  tags are scanned (an escaped listing starts with `&lt;`, so it never
 *  matches); a fragment or query is dropped; `../` and `/` resolve against
 *  the repo root, anything else against `spec/`. Absolute URLs and `data:`
 *  URIs are not files a build can check and are left out. */
export function specAssetRefs(html) {
  const refs = [];
  for (const m of html.matchAll(/<(?:link|script|img|a|source)\b[^>]*?\b(?:href|src)=["']([^"'#?][^"']*)["']/gi)) {
    const ref = m[1].replace(/[#?].*$/, '');
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) continue;
    const rel = ref.startsWith('../') ? ref.slice(3) : ref.startsWith('/') ? ref.slice(1) : `spec/${ref}`;
    refs.push({ ref, rel });
  }
  return refs;
}

/** Rewrite a spec page for dist/spec/: `../dist/` becomes `../`, because the
 *  copied page sits beside the bundles' parent instead of the repo root.
 *  Only real tags are touched; an escaped example in a listing is text. */
export function rewriteSpecPage(html) {
  return html.replace(/(<(?:link|script)\b[^>]*?\b(?:href|src)=["'])\.\.\/dist\//gi, '$1../');
}
