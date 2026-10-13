/**
 * scripts/build.mjs — the one bundle, one command (spec v0.6).
 *
 * `vite build` with `build.lib.formats: ['iife']` supports exactly one entry,
 * and the package ships exactly one script:
 *
 *   dist/semtext.js   Lit custom elements + the vanilla handlers (core,
 *                     reading, Markdown) + extraction   (global SemText)
 *
 * plus its stylesheets, copied verbatim from themes/ (no build step — the
 * theme files are the shipped artifacts):
 *
 *   dist/semtext.css                    from themes/_vocabulary.css
 *   dist/themes/semtext-theme-<n>.css   from themes/<n>.css
 *
 * The former per-tier scripts (semtext-fallback.js, semtext-reading.js,
 * semtext-extract.js, semtext-md.js) are retired: everything lives in the
 * one IIFE, and the handlers run for elements no component defines.
 *
 * Beside the full bundle (and never instead of it — see the surface
 * contract in its banner), the LAZY phase below emits:
 *
 *   dist/semtext-lazy.js        scans the document for sem-* / npl-*
 *                               tags (the <sem-text> wrapper is optional)
 *                               and imports only the component chunks
 *                               those tags need (ES modules; needs a
 *                               server)
 *   dist/chunks/<tag>.js        one entry chunk per component (from the
 *                               register calls in src/lit/sem-*.ts) plus the
 *                               shared chunks rollup factors out
 *   dist/semtext-manifest.json  the generated tag → chunk manifest
 *
 * The manifest is generated from the component list, never hand-maintained:
 * a new src/lit/sem-*.ts calling `SemElement.register('<tag>', …)` is
 * picked up on the next build. The chunk split changes no bytes of
 * dist/semtext.js — the IIFE phase runs first, untouched.
 *
 * The target declares a size budget; the build prints measured size against
 * it and fails only if `--strict-budget` is passed, so a budget overrun is
 * always visible but never silently blocks local work. The budget history is
 * recorded in ROADMAP.md ("R — Reading experience"); change both together.
 */

import { existsSync, rmSync, statSync, readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';

// Pin NODE_ENV before vite is even imported: ambient NODE_ENV=test (a vitest
// run that self-builds via dockerfile.test.mjs) otherwise selects Lit's
// "development" export condition and inflates the artifact ~12 KB — the
// budget would then measure a bundle we never ship.
process.env.NODE_ENV = 'production';
const { build } = await import('vite');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict-budget');

const targets = [
  {
    name: 'semtext.js',
    entry: 'src/index.ts',
    global: 'SemText',
    // Raised from the five-artifact total (fallback 14 + reading 19.5 +
    // semtext.js 56 + extract 12 + md 8.5): the single bundle pays shared
    // module overhead once. History per retired artifact in ROADMAP.md.
    budgetKb: 96,
    required: true,
  },
];

rmSync(resolve(root, 'dist'), { recursive: true, force: true });

const results = [];
let overBudget = false;

for (const target of targets) {
  const entry = resolve(root, target.entry);
  if (!existsSync(entry)) {
    if (target.required) {
      console.error(`✗ ${target.name}: entry ${target.entry} is missing — cannot build`);
      process.exit(1);
    }
    console.warn(`• ${target.name}: skipped — entry ${target.entry} does not exist yet`);
    continue;
  }

  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      target: 'es2022',
      outDir: 'dist',
      emptyOutDir: false,
      lib: { entry, formats: ['iife'], name: target.global, fileName: () => target.name },
    },
  });

  const file = resolve(root, 'dist', target.name);
  const bytes = statSync(file).size;
  const gzip = gzipSync(readFileSync(file)).length;
  const budget = target.budgetKb * 1024;
  if (bytes > budget) overBudget = true;
  results.push({ name: target.name, bytes, gzip, budget, ok: bytes <= budget });
}

/* ---------------------------------------------------------------------------
 * Lazy phase — semtext-lazy.js + chunks/ (see the header comment).
 *
 * The surface contract ships as a banner prepended AFTER the build, because
 * minification strips source comments and the artifact must state its own
 * terms (server required; semtext.js is the saved-single-file surface).
 * ------------------------------------------------------------------------ */

const LAZY_BANNER = `/*
 * semtext-lazy.js — SemText, on demand (spec v0.6).
 *
 * Pair with semtext.css: this script scans the whole document for sem-* /
 * npl-* tags (a <sem-text> wrapper is welcome but not required) and
 * imports only the component chunks the build-time manifest maps those
 * tags to — components not on the page never download. Elements sit in
 * the :not(:defined) base box until their chunk arrives; a failed chunk
 * leaves a role="alert" note on its elements and never blocks the other
 * chunks. Class-form aliases (.sem-note etc.) are not tags and never
 * trigger a load.
 *
 * Surface contract: dynamic import needs a server — this script does not
 * work from file://. For saved single-file documents use semtext.js, the
 * full bundle, which has no runtime imports.
 */
`;

const LAZY_ENTRY = 'src/lazy/index.ts';
const litDir = resolve(root, 'src/lit');

/** tag → chunk path (relative to dist/), and chunk-stem → entry file. Both
 *  derived from the same register calls the full bundle is built from. */
const lazyManifest = {};
const componentEntries = {};
for (const file of readdirSync(litDir).filter((f) => f.startsWith('sem-') && f.endsWith('.ts')).sort()) {
  const source = readFileSync(resolve(litDir, file), 'utf8');
  const stem = basename(file, '.ts');
  for (const m of source.matchAll(/SemElement\.register\(\s*'([a-z][a-z0-9-]*)'/g)) {
    const tag = m[1];
    if (lazyManifest[tag]) {
      console.error(`✗ lazy build: tag "${tag}" is registered by both ${lazyManifest[tag]} and chunks/${stem}.js — one component per tag`);
      process.exit(1);
    }
    lazyManifest[tag] = `chunks/${stem}.js`;
    componentEntries[stem] = resolve(litDir, file);
  }
}

if (Object.keys(lazyManifest).length === 0) {
  console.error('✗ lazy build: no SemElement.register(...) found in src/lit/sem-*.ts');
  process.exit(1);
}
if (!existsSync(resolve(root, LAZY_ENTRY))) {
  console.error(`✗ semtext-lazy.js: entry ${LAZY_ENTRY} is missing — cannot build`);
  process.exit(1);
}

/** Serves the generated manifest to the bundle at build time, so the
 *  artifact inlines it (no runtime fetch of a JSON file) while the source
 *  never hardcodes a component list. */
const semtextManifestPlugin = {
  name: 'semtext-manifest',
  resolveId(id) {
    return id === 'virtual:semtext-manifest' ? '\0virtual:semtext-manifest' : null;
  },
  load(id) {
    return id === '\0virtual:semtext-manifest' ? `export default ${JSON.stringify(lazyManifest)};` : null;
  },
};

await build({
  root,
  configFile: false,
  logLevel: 'warn',
  plugins: [semtextManifestPlugin],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: false,
    // No preload helper: the loader's dynamic imports are @vite-ignore'd
    // (they resolve at runtime, next to the built script) and the entry
    // ships alone, not wrapped in vite's module-preload runtime.
    modulePreload: false,
    rollupOptions: {
      input: { ...componentEntries, 'semtext-lazy': resolve(root, LAZY_ENTRY) },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'semtext-lazy' ? 'semtext-lazy.js' : `chunks/${chunk.name}.js`),
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
});

const lazyPath = resolve(root, 'dist', 'semtext-lazy.js');
writeFileSync(lazyPath, LAZY_BANNER + readFileSync(lazyPath, 'utf8'));
writeFileSync(
  resolve(root, 'dist', 'semtext-manifest.json'),
  JSON.stringify(lazyManifest, null, 2) + '\n',
);

{
  const bytes = statSync(lazyPath).size;
  const gzip = gzipSync(readFileSync(lazyPath)).length;
  const budget = 8 * 1024;
  if (bytes > budget) overBudget = true;
  results.push({ name: 'semtext-lazy.js', bytes, gzip, budget, ok: bytes <= budget });
  const shared = readdirSync(resolve(root, 'dist', 'chunks')).filter((f) => !Object.values(lazyManifest).includes(`chunks/${f}`));
  console.log(
    `  lazy: ${Object.keys(lazyManifest).length} component chunks ` +
      `+ ${shared.length} shared chunk(s), manifest inlined`,
  );
}

/* Stylesheets: the theme sources ARE the shipped artifacts. The vocabulary
 * ships as the bundle's stylesheet (dist/semtext.css); named themes keep
 * their `semtext-theme-` prefix so a consumer's `./themes/*` import and a
 * CDN path name the same file. */
const themesDir = resolve(root, 'themes');
const distThemesDir = resolve(root, 'dist', 'themes');
mkdirSync(distThemesDir, { recursive: true });
const cssCopies = [];
for (const css of readdirSync(themesDir).filter((f) => f.endsWith('.css')).sort()) {
  if (css === '_vocabulary.css') {
    copyFileSync(resolve(themesDir, css), resolve(root, 'dist', 'semtext.css'));
    cssCopies.push({ from: `themes/${css}`, to: 'dist/semtext.css' });
  } else {
    copyFileSync(resolve(themesDir, css), resolve(distThemesDir, `semtext-theme-${css}`));
    cssCopies.push({ from: `themes/${css}`, to: `dist/themes/semtext-theme-${css}` });
  }
}

console.log('\n  artifact              size     gzip    budget');
console.log('  ------------------------------------------------');
for (const r of results) {
  const kb = (n) => (n / 1024).toFixed(1).padStart(6) + ' KB';
  console.log(
    `  ${r.name.padEnd(20)}${kb(r.bytes)}${kb(r.gzip)}${kb(r.budget)}  ${r.ok ? '✓' : '✗ OVER'}`,
  );
}
for (const c of cssCopies) console.log(`  ${c.from.padEnd(20)}      → ${c.to}`);
console.log('');

if (overBudget && strict) {
  console.error('✗ size budget exceeded (--strict-budget)');
  process.exit(1);
}
