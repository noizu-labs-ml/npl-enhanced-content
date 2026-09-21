import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

export default {
  e2e: {
    baseUrl: 'http://localhost:4173',
    specPattern: 'test/e2e/**/*.cy.js',
    supportFile: 'test/support/e2e.js',
    screenshotsFolder: 'test/screenshots',
    videosFolder: 'test/videos',
    setupNodeEvents(on) {
      on('task', {
        // Measures a built dist file the same way scripts/build-standalone.mjs
        // does, so a spec can assert stated page copy matches the real
        // artifact instead of a number that could silently drift.
        sizeOfDistFile(relPath) {
          const buf = readFileSync(relPath);
          return {
            kb: buf.length / 1024,
            gzipKb: gzipSync(buf).length / 1024
          };
        }
      });
    }
  }
};
