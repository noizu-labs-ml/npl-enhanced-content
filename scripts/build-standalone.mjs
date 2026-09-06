/**
 * scripts/build-standalone.mjs — assemble portable single-file documents.
 *
 * Reads every `web/demo/*.html` source and substitutes marker comments with real
 * content, emitting two artifacts per source into `dist/demo/`. Pages under
 * `web/site/` are copied to `dist/site/` by the same marker expansion.
 *
 * Per demo source:
 *
 *   <name>.html        everything inlined — opens from file:// with no network
 *   <name>.nojs.html   the same page with every <script> element removed
 *
 * The `.nojs.html` variant is the genuine JS-off artifact. The older
 * `window.__semJsOff` kill switch only proves the handler no-ops; it leaves
 * the script in the page, so it can never show that the CSS alone degrades
 * readably. Stripping the elements is the real test.
 *
 * Markers (HTML comments, so a source page stays valid HTML on its own):
 *
 *   <!-- sem:inline bundle -->                     dist/semtext.js
 *   <!-- sem:inline fallback -->                   dist/semtext-fallback.js
 *   <!-- sem:inline extract -->                    dist/semtext-extract.js
 *   <!-- sem:inline theme <name> -->               themes/<name>.css
 *   <!-- sem:inline vocabulary -->                 themes/_vocabulary.css
 *
 * A marker whose source file is missing is a hard error: silently emitting a
 * page with no behavior in it is exactly the failure this script exists to
 * prevent.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'dist', 'demo');

const MARKER = /<!--\s*sem:inline\s+([a-z-]+)(?:\s+([A-Za-z0-9._-]+))?\s*-->/g;

function readOrDie(path, marker) {
  if (!existsSync(path)) {
    throw new Error(`marker "${marker}" needs ${path}, which does not exist — run scripts/build.mjs first`);
  }
  return readFileSync(path, 'utf8');
}

function expand(kind, arg) {
  switch (kind) {
    case 'bundle':
      return `<script>\n${readOrDie(resolve(root, 'dist/semtext.js'), 'bundle')}\n</script>`;
    case 'fallback':
      return `<script id="sem-fallback">\n${readOrDie(resolve(root, 'dist/semtext-fallback.js'), 'fallback')}\n</script>`;
    case 'extract':
      return `<script id="sem-extract">\n${readOrDie(resolve(root, 'dist/semtext-extract.js'), 'extract')}\n</script>`;
    case 'theme': {
      if (!arg) throw new Error('marker "theme" requires a theme name');
      return `<style data-sem-theme-source="${arg}">\n${readOrDie(resolve(root, 'themes', `${arg}.css`), 'theme')}\n</style>`;
    }
    case 'vocabulary':
      return `<style data-sem-vocabulary>\n${readOrDie(resolve(root, 'themes/_vocabulary.css'), 'vocabulary')}\n</style>`;
    default:
      throw new Error(`unknown inline marker "${kind}"`);
  }
}

/** Remove whole <script> elements. A JS string cannot contain a literal
 *  `</script>` without breaking the surrounding HTML, so this is safe.
 *  The end tag allows ignored junk before `>` (`</script foo>`, and newlines
 *  count as whitespace), so match `\b[^>]*` rather than `\s*` — otherwise a
 *  script survives into the nojs artifact. */
function stripScripts(html) {
  let out = html;
  // Removing one pair can reveal another, so run to a fixed point rather
  // than single-pass.
  let prev;
  do {
    prev = out;
    out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, '');
  } while (out !== prev);
  // An unclosed opener has no matching end tag and would otherwise survive.
  out = out.replace(/<script\b[\s\S]*$/i, '');
  // This artifact exists to prove the document reads with scripts off, so a
  // survivor is a build failure, not a warning.
  if (/<script/i.test(out)) {
    throw new Error('nojs artifact still contains <script after stripping');
  }
  return out.replace(/\n{3,}/g, '\n\n');
}

mkdirSync(outDir, { recursive: true });

const sources = readdirSync(resolve(root, 'web', 'demo'))
  .filter((f) => f.endsWith('.html'))
  .sort();

if (sources.length === 0) {
  console.error('✗ no web/demo/*.html sources found');
  process.exit(1);
}

console.log('\n  page                          inlined   size     nojs');
console.log('  ---------------------------------------------------------');

for (const file of sources) {
  const src = readFileSync(resolve(root, 'web', 'demo', file), 'utf8');
  let count = 0;
  const built = src.replace(MARKER, (_m, kind, arg) => {
    count++;
    return expand(kind, arg);
  });

  const name = basename(file, '.html');
  const page = resolve(outDir, `${name}.html`);
  const nojs = resolve(outDir, `${name}.nojs.html`);
  writeFileSync(page, built);
  writeFileSync(nojs, stripScripts(built));

  const kb = (p) => (statSync(p).size / 1024).toFixed(1).padStart(6) + ' KB';
  console.log(`  ${file.padEnd(30)}${String(count).padStart(5)}  ${kb(page)}${kb(nojs)}`);
}
console.log('');

/* ---------------------------------------------------------------------------
 * Marketing site — web/site/ → dist/site/
 *
 * Plain copy, not a standalone assembly: the site pages carry no `sem:inline`
 * markers today. Marker expansion is applied anyway so a future page can opt
 * in without another build path. Absent web/site/, this section is a no-op.
 * ------------------------------------------------------------------------ */

const siteSrcDir = resolve(root, 'web', 'site');
if (existsSync(siteSrcDir)) {
  const siteOutDir = resolve(root, 'dist', 'site');
  mkdirSync(siteOutDir, { recursive: true });

  const sitePages = readdirSync(siteSrcDir).filter((f) => f.endsWith('.html')).sort();

  console.log('  site page                     inlined   size');
  console.log('  ---------------------------------------------------------');
  for (const file of sitePages) {
    const src = readFileSync(resolve(siteSrcDir, file), 'utf8');
    let count = 0;
    const built = src.replace(MARKER, (_m, kind, arg) => {
      count++;
      return expand(kind, arg);
    });
    const page = resolve(siteOutDir, file);
    writeFileSync(page, built);
    const kb = (p) => (statSync(p).size / 1024).toFixed(1).padStart(6) + ' KB';
    console.log(`  ${file.padEnd(30)}${String(count).padStart(5)}  ${kb(page)}`);
  }
  console.log('');
}
