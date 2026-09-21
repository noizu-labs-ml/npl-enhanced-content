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
        // Gzips content a spec already fetched over HTTP from the running
        // preview server (see test/e2e/site.cy.js), so the measurement is of
        // the artifact vite preview actually served — not a disk file that
        // could legitimately diverge from it (stale build, separate deploy).
        // Takes the response body as a 'binary'-encoded string (see cy.request
        // encoding below) so byte length survives the round trip intact.
        gzipSize(binaryBody) {
          const buf = Buffer.from(binaryBody, 'binary');
          return {
            kb: buf.length / 1024,
            gzipKb: gzipSync(buf).length / 1024
          };
        }
      });
    }
  }
};
