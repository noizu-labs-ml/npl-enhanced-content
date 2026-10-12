/**
 * scripts/build.mjs — five artifacts, one command.
 *
 * `vite build` with `build.lib.formats: ['iife']` supports exactly one entry,
 * and this package ships five independent classic scripts:
 *
 *   dist/semtext.js           Lit custom elements          (global SemText)
 *   dist/semtext-fallback.js  vanilla fallback tier        (global SemTextFallback)
 *   dist/semtext-reading.js   prose-reading behaviours     (global SemTextReading)
 *   dist/semtext-extract.js   record extraction            (global SemTextExtract)
 *   dist/semtext-md.js        sem-md Markdown renderer     (global SemTextMd)
 *
 * They are separate on purpose. The fallback tier must run in a document that
 * never loads Lit, so it cannot share a bundle with it.
 *
 * Each target declares a size budget; the build prints measured size against
 * it and fails only if `--strict-budget` is passed, so a budget overrun is
 * always visible but never silently blocks local work. The budget table is
 * recorded in ROADMAP.md ("R — Reading experience"); change both together.
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
  { name: 'semtext.js',          entry: 'src/index.ts',          global: 'SemText',         budgetKb: 85, required: true },
  // 13 → 14 KB (2026-09-22, tag form canonical, measured 13.0): every core
  // handler selects both authoring forms (`:is(sem-x, .sem-x)`), the
  // bare→data-* attribute mirror, the tag-form note body wrap. Recorded in
  // ROADMAP "Tag-form canonical decisions".
  { name: 'semtext-fallback.js', entry: 'src/fallback/index.ts', global: 'SemTextFallback', budgetKb: 14, required: true },
  // 19.5 → 27 KB (2026-10-13, data-visualizer phase 1, measured 25.6): the
  // sem-data-visualizer render/sort tier (src/reading/data.ts +
  // src/data/table.ts) joins the bundle; spec/data-visualizer.md §11. The
  // Lit bundle carries the same module (56 → 63). Recorded in ROADMAP
  // "Size budgets".
  // 27 → 36 KB (2026-10-13, phase 2, measured 35.3): inline csv/yaml/json
  // payload parsers + sql shape declarations (src/data/{csv,yaml,json,sql}.ts).
  // 36 → 40 KB (2026-10-13, phase 3, measured 39.7): declared structures —
  // data-columns overlay + the OpenAPI-style yaml-schema flattener
  // (src/data/structure.ts).
  // 40 → 43 KB (2026-10-13, phase 4, measured 42.4): the source loader tier —
  // URL policy, sniffing, fetch + cache (src/data/load.ts,
  // src/reading/data-load.ts).
  // 43 → 55 KB (2026-10-13, phase 5, measured 54.1): the query engine +
  // chrome — §8 SQL subset parser/executor, sem-data-join materialization,
  // editable query textarea, view buttons (src/data/query.ts,
  // src/reading/data-query.ts, data-tableview.ts). Budgets move with
  // scripts/build.mjs and ROADMAP "Size budgets" together.
  { name: 'semtext-reading.js',  entry: 'src/reading/index.ts',  global: 'SemTextReading',  budgetKb: 55, required: true },
  { name: 'semtext-extract.js',  entry: 'src/extract/index.ts',  global: 'SemTextExtract',  budgetKb: 12, required: false },
  { name: 'semtext-md.js',       entry: 'src/md/index.ts',       global: 'SemTextMd',       budgetKb: 8.5,  required: true },
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
