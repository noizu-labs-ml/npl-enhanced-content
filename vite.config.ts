import { defineConfig } from 'vite';

/**
 * Shared dev/preview config. The BUILD does not go through this file.
 *
 * This package emits three independent IIFE artifacts (npl.js,
 * npl-fallback.js, npl-extract.js) and `build.lib` with `formats: ['iife']`
 * accepts a single entry, so `npm run build` drives the Vite JS API from
 * scripts/build.mjs instead. Build options live there, next to the size
 * budgets they are checked against.
 *
 * `vite preview` serves `dist/` as the web root, which is why the cypress
 * baseUrl resolves `/demo/index.html` to `dist/demo/index.html` — the BUILT
 * page, not the marker source in `demo/`.
 */
export default defineConfig({
  build: { outDir: 'dist', target: 'es2022' },
  server: { port: 5173 },
  preview: { port: 4173 }
});
