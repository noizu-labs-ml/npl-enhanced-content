/**
 * scripts/build.mjs — three artifacts, one command.
 *
 * `vite build` with `build.lib.formats: ['iife']` supports exactly one entry,
 * and this package ships three independent classic scripts:
 *
 *   dist/npl.js           Lit custom elements          (global NPL)
 *   dist/npl-fallback.js  vanilla fallback tier        (global NPLFallback)
 *   dist/npl-extract.js   record extraction            (global NPLExtract)
 *
 * They are separate on purpose. The fallback tier must run in a document that
 * never loads Lit, so it cannot share a bundle with it.
 *
 * Each target declares a size budget; the build prints measured size against
 * it and fails only if `--strict-budget` is passed, so a budget overrun is
 * always visible but never silently blocks local work.
 */

import { build } from 'vite';
import { existsSync, rmSync, statSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict-budget');

/** budgetKb is measured against the minified (not gzipped) artifact. */
const targets = [
  { name: 'npl.js',          entry: 'src/index.ts',          global: 'NPL',         budgetKb: 40, required: true },
  { name: 'npl-fallback.js', entry: 'src/fallback/index.ts', global: 'NPLFallback', budgetKb: 8,  required: true },
  { name: 'npl-extract.js',  entry: 'src/extract/index.ts',  global: 'NPLExtract',  budgetKb: 8,  required: false },
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

console.log('\n  artifact              size     gzip    budget');
console.log('  ------------------------------------------------');
for (const r of results) {
  const kb = (n) => (n / 1024).toFixed(1).padStart(6) + ' KB';
  console.log(
    `  ${r.name.padEnd(20)}${kb(r.bytes)}${kb(r.gzip)}${kb(r.budget)}  ${r.ok ? '✓' : '✗ OVER'}`,
  );
}
console.log('');

if (overBudget && strict) {
  console.error('✗ size budget exceeded (--strict-budget)');
  process.exit(1);
}
