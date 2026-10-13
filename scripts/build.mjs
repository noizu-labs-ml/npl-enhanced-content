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
 * Beside the full bundles (and never instead of them — see the surface
 * contract in each lazy banner), the LAZY phase below emits two loaders,
 * one per namespace, from the same shared boot wiring (src/lazy/boot.ts):
 *
 *   dist/semtext-lazy.js        scans the document for sem-* tags (the
 *                               <sem-text> wrapper is optional) and imports
 *                               only the component chunks those tags need
 *                               (ES modules; needs a server)
 *   dist/chunks/<tag>.js        one entry chunk per sem-* component (from
 *                               the register calls in src/lit/sem-*.ts) plus
 *                               the shared chunks rollup factors out
 *   dist/npl-lazy.js            the same contract for the npl-* namespace
 *                               (src/lit/npl/npl-*.ts, defineNpl calls)
 *   dist/npl-chunks/<tag>.js    one entry chunk per npl-* component plus
 *                               its shared chunks
 *   dist/semtext-manifest.json  the generated tag → chunk manifests
 *   dist/npl-manifest.json      (one per loader)
 *
 * Both manifests are generated from the component lists, never
 * hand-maintained: a new component — src/lit/sem-*.ts calling
 * `SemElement.register('<tag>', …)`, or src/lit/npl/npl-*.ts calling
 * `defineNpl('<tag>', …)` — is picked up on the next build and inlined
 * into its loader through a virtual module. The chunk split changes no
 * bytes of dist/semtext.js — the IIFE phase runs first, untouched. Core
 * (semtext.js, semtext-lazy.js, chunks/) carries only sem-* code; the npl
 * namespace ships whole in npl.js or per-document in npl-lazy.js.
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
  {
    // The npl-* namespace, whole, for NPL documents that skip chunk
    // loading. Core never carries this code: src/index.ts imports nothing
    // from src/lit/npl/, and the npl barrel is src/npl.ts's only input.
    name: 'npl.js',
    entry: 'src/npl.ts',
    global: 'NPL',
    budgetKb: 48,
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
 * Lazy phase — semtext-lazy.js + chunks/, npl-lazy.js + npl-chunks/ (see
 * the header comment). One loop, one config per namespace.
 *
 * The surface contract ships as a banner prepended AFTER the build, because
 * minification strips source comments and each artifact must state its own
 * terms (server required; the full bundle is the saved-single-file surface).
 * ------------------------------------------------------------------------ */

/** One lazy loader per tag namespace: which source dir feeds the manifest
 *  scan, which register call names its components, where its entry lives
 *  and where its chunks land. The two builds are independent rollup runs —
 *  shared helpers (the Lit runtime, SemElement) are factored per loader,
 *  and double registration is impossible: SemElement.register and
 *  defineNpl are both idempotent, and the manifests are disjoint. */
const LAZY_TARGETS = [
  {
    id: 'semtext-lazy',
    entry: 'src/lazy/index.ts',
    litDir: resolve(root, 'src/lit'),
    fileFilter: (f) => f.startsWith('sem-') && f.endsWith('.ts'),
    registerRe: /SemElement\.register\(\s*'([a-z][a-z0-9-]*)'/g,
    virtualId: 'virtual:semtext-manifest',
    chunkDir: 'chunks',
    budgetKb: 8,
    fullBundle: 'semtext.js',
    tags: 'sem-*',
  },
  {
    id: 'npl-lazy',
    entry: 'src/lazy/npl.ts',
    litDir: resolve(root, 'src/lit/npl'),
    fileFilter: (f) => f.startsWith('npl-') && f.endsWith('.ts'),
    registerRe: /defineNpl\(\s*'([a-z][a-z0-9-]*)'/g,
    virtualId: 'virtual:npl-manifest',
    chunkDir: 'npl-chunks',
    budgetKb: 8,
    fullBundle: 'npl.js',
    tags: 'npl-*',
  },
];

for (const lazy of LAZY_TARGETS) {
  if (!existsSync(resolve(root, lazy.entry))) {
    console.error(`✗ ${lazy.id}.js: entry ${lazy.entry} is missing — cannot build`);
    process.exit(1);
  }

  /** tag → chunk path (relative to dist/), and chunk-stem → entry file.
   *  Both derived from the same register calls the full bundle is built
   *  from — the manifest can never name a component the bundle lacks. */
  const lazyManifest = {};
  const componentEntries = {};
  for (const file of readdirSync(lazy.litDir).filter(lazy.fileFilter).sort()) {
    const source = readFileSync(resolve(lazy.litDir, file), 'utf8');
    const stem = basename(file, '.ts');
    for (const m of source.matchAll(lazy.registerRe)) {
      const tag = m[1];
      if (lazyManifest[tag]) {
        console.error(`✗ ${lazy.id} build: tag "${tag}" is registered by both ${lazyManifest[tag]} and ${lazy.chunkDir}/${stem}.js — one component per tag`);
        process.exit(1);
      }
      lazyManifest[tag] = `${lazy.chunkDir}/${stem}.js`;
      componentEntries[stem] = resolve(lazy.litDir, file);
    }
  }

  if (Object.keys(lazyManifest).length === 0) {
    console.error(`✗ ${lazy.id} build: no register calls found in ${lazy.litDir}`);
    process.exit(1);
  }

  /** Serves the generated manifest to the bundle at build time, so the
   *  artifact inlines it (no runtime fetch of a JSON file) while the
   *  source never hardcodes a component list. */
  const manifestPlugin = {
    name: `${lazy.id}-manifest`,
    resolveId(id) {
      return id === lazy.virtualId ? `\0${lazy.virtualId}` : null;
    },
    load(id) {
      return id === `\0${lazy.virtualId}` ? `export default ${JSON.stringify(lazyManifest)};` : null;
    },
  };

  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [manifestPlugin],
    build: {
      target: 'es2022',
      outDir: 'dist',
      emptyOutDir: false,
      // No preload helper: the loader's dynamic imports are @vite-ignore'd
      // (they resolve at runtime, next to the built script) and the entry
      // ships alone, not wrapped in vite's module-preload runtime.
      modulePreload: false,
      rollupOptions: {
        input: { ...componentEntries, [lazy.id]: resolve(root, lazy.entry) },
        output: {
          entryFileNames: (chunk) => (chunk.name === lazy.id ? `${lazy.id}.js` : `${lazy.chunkDir}/${chunk.name}.js`),
          chunkFileNames: `${lazy.chunkDir}/[name]-[hash].js`,
        },
      },
    },
  });

  const banner = `/*
 * ${lazy.id}.js — ${lazy.tags} components, on demand (spec v0.6).
 *
 * Pair with semtext.css: this script scans the whole document for ${lazy.tags}
 * tags (a wrapper is welcome but not required) and imports only the
 * component chunks the build-time manifest maps those tags to — components
 * not on the page never download. Elements sit in the :not(:defined) base
 * box until their chunk arrives; a failed chunk leaves a role="alert" note
 * on its elements and never blocks the other chunks. Class-form aliases
 * are not tags and never trigger a load.
 *
 * Surface contract: dynamic import needs a server — this script does not
 * work from file://. For saved single-file documents use ${lazy.fullBundle},
 * the full bundle, which has no runtime imports.
 */
`;
  const lazyPath = resolve(root, 'dist', `${lazy.id}.js`);
  writeFileSync(lazyPath, banner + readFileSync(lazyPath, 'utf8'));
  writeFileSync(
    resolve(root, 'dist', `${lazy.id.replace(/-lazy$/, '')}-manifest.json`),
    JSON.stringify(lazyManifest, null, 2) + '\n',
  );

  const bytes = statSync(lazyPath).size;
  const gzip = gzipSync(readFileSync(lazyPath)).length;
  const budget = lazy.budgetKb * 1024;
  if (bytes > budget) overBudget = true;
  results.push({ name: `${lazy.id}.js`, bytes, gzip, budget, ok: bytes <= budget });
  const shared = readdirSync(resolve(root, 'dist', lazy.chunkDir)).filter(
    (f) => !Object.values(lazyManifest).includes(`${lazy.chunkDir}/${f}`),
  );
  console.log(
    `  ${lazy.id}: ${Object.keys(lazyManifest).length} component chunks ` +
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
