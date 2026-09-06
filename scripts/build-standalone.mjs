/**
 * scripts/build-standalone.mjs — assemble portable single-file documents.
 *
 * Reads every `demo/*.html` source and substitutes marker comments with real
 * content, emitting two artifacts per source into `dist/demo/`:
 *
 *   <name>.html        everything inlined — opens from file:// with no network
 *   <name>.nojs.html   the same page with every <script> element removed
 *
 * The `.nojs.html` variant is the genuine JS-off artifact. The older
 * `window.__nplJsOff` kill switch only proves the handler no-ops; it leaves
 * the script in the page, so it can never show that the CSS alone degrades
 * readably. Stripping the elements is the real test.
 *
 * Markers (HTML comments, so a source page stays valid HTML on its own):
 *
 *   <!-- npl:inline bundle -->                     dist/npl.js
 *   <!-- npl:inline fallback -->                   dist/npl-fallback.js
 *   <!-- npl:inline extract -->                    dist/npl-extract.js
 *   <!-- npl:inline theme <name> -->               themes/<name>.css
 *   <!-- npl:inline vocabulary -->                 themes/_vocabulary.css
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

const MARKER = /<!--\s*npl:inline\s+([a-z-]+)(?:\s+([A-Za-z0-9._-]+))?\s*-->/g;

function readOrDie(path, marker) {
  if (!existsSync(path)) {
    throw new Error(`marker "${marker}" needs ${path}, which does not exist — run scripts/build.mjs first`);
  }
  return readFileSync(path, 'utf8');
}

function expand(kind, arg) {
  switch (kind) {
    case 'bundle':
      return `<script>\n${readOrDie(resolve(root, 'dist/npl.js'), 'bundle')}\n</script>`;
    case 'fallback':
      return `<script id="npl-fallback">\n${readOrDie(resolve(root, 'dist/npl-fallback.js'), 'fallback')}\n</script>`;
    case 'extract':
      return `<script id="npl-extract">\n${readOrDie(resolve(root, 'dist/npl-extract.js'), 'extract')}\n</script>`;
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
 *  `</script>` without breaking the surrounding HTML, so this is safe. */
function stripScripts(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/\n{3,}/g, '\n\n');
}

mkdirSync(outDir, { recursive: true });

const sources = readdirSync(resolve(root, 'demo'))
  .filter((f) => f.endsWith('.html'))
  .sort();

if (sources.length === 0) {
  console.error('✗ no demo/*.html sources found');
  process.exit(1);
}

console.log('\n  page                          inlined   size     nojs');
console.log('  ---------------------------------------------------------');

for (const file of sources) {
  const src = readFileSync(resolve(root, 'demo', file), 'utf8');
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
