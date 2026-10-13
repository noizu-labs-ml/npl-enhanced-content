import type { ShellLine } from '../terminal/terminal-core.js';
import { SemElement } from '../lit/base.js';
import { SemTerminal } from '../terminal/sem-terminal.js';
import { demoPlugin } from '../terminal/plugins/demo/plugin.js';
import { posixPlugin } from '../terminal/plugins/posix/plugin.js';

/**
 * sem-shell — the SemText demo terminal: <sem-terminal> configured with the
 * bundled plugins and nothing more.
 *
 * Two JS-object manifests mount locally (no fetch):
 *
 *   - posix-sh   the POSIX-style command set over the virtual file system
 *                (src/terminal/plugins/posix/): ls, cat, bat, grep, pipes,
 *                redirects, $?, export/alias/history...
 *   - semtext-demo the /demo documents and the semtext/open commands
 *                (src/terminal/plugins/demo/)
 *
 * Then it demonstrates the PLUGINS.md CDN rule by attempting a third plugin
 * from an absolute https URL with no integrity hash: the loader refuses it
 * BEFORE any network request, prints the refusal as a stderr line, and
 * records it on core.loadErrors.
 *
 * Real remote plugins are the parent element's job:
 * `<sem-terminal plugins="https://cdn/…/manifest.json#sha256-… …">`.
 */
export class SemShell extends SemTerminal {
  #shellBooted = false;

  connectedCallback(): void {
    super.connectedCallback();
    if (this.#shellBooted) return;
    this.#shellBooted = true;
    this.setAttribute('aria-label', 'SemText shell');

    const lines: ShellLine[] = [];
    for (const manifest of [posixPlugin, demoPlugin]) {
      const mounted = this.core.mountPlugin(manifest);
      if (mounted.ok) {
        lines.push({
          kind: 'stdout',
          text: `plugin ${manifest.name} ${manifest.version} mounted — ${manifest.commands.length} commands`,
        });
      } else {
        lines.push({ kind: 'stderr', text: `plugin ${manifest.name}: ${mounted.error}` });
      }
    }
    lines.push({ kind: 'stdout', text: 'type help to begin — or press replay to watch the demo.' });
    this.appendLines(lines);
    // The CDN-rule demo: absolute https, no integrity — refused pre-fetch.
    void this.core
      .loadPluginFromUrl('https://cdn.noizu.com/semtext/plugins/extra/manifest.json')
      .then((result) => {
        if (!result.ok) {
          this.appendLines([{ kind: 'stderr', text: `plugin https://cdn.noizu.com/…: ${result.error}` }]);
        }
      });
  }
}

SemElement.register('sem-shell', SemShell);
