import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['iife'],
      name: 'NPL',
      fileName: () => 'npl.js'
    },
    target: 'es2022'
  },
  server: { port: 5173 },
  preview: { port: 4173 }
});
