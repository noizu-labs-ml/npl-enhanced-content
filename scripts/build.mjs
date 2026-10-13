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
 * The target declares a size budget; the build prints measured size against
 * it and fails only if `--strict-budget` is passed, so a budget overrun is
 * always visible but never silently blocks local work. The budget history is
 * recorded in ROADMAP.md ("R — Reading experience"); change both together.
 */

import { existsSync, rmSync, statSync, readFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

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
