import type { ShellLine } from '../terminal/terminal-core.js';
import { SemElement } from '../lit/base.js';
import { SemTerminal } from '../terminal/sem-terminal.js';
import { demoPlugin } from '../terminal/plugins/demo/plugin.js';

/**
 * sem-shell — the SemText demo terminal: <sem-terminal> configured with the
 * semtext-demo plugin (src/terminal/plugins/demo/) and nothing more.
 *
 * On connect it mounts the demo plugin locally (bundled JS-object manifest
 * — no fetch: the SemText commands ls/cat/cd/pwd/semtext/open plus the
 * /demo documents), then demonstrates the PLUGINS.md CDN rule by attempting
 * a second plugin from an absolute https URL with no integrity hash: the
 * loader refuses it BEFORE any network request, prints the refusal as a
 * stderr line, and records it on core.loadErrors.
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

    const mounted = this.core.mountPlugin(demoPlugin);
    const lines: ShellLine[] = [];
    if (mounted.ok) {
      lines.push({
        kind: 'stdout',
        text: `plugin ${demoPlugin.name} ${demoPlugin.version} mounted — /demo documents, ${demoPlugin.commands.length} commands`,
      });
    } else {
      lines.push({ kind: 'stderr', text: `plugin ${demoPlugin.name}: ${mounted.error}` });
    }
    // The CDN-rule demo: absolute https, no integrity — refused pre-fetch.
    void this.core
      .loadPluginFromUrl('https://cdn.noizu.com/semtext/plugins/extra/manifest.json')
      .then((result) => {
        if (!result.ok) {
          this.appendLines([{ kind: 'stderr', text: `plugin https://cdn.noizu.com/…: ${result.error}` }]);
        }
      });
    this.appendLines(lines);
  }
}

SemElement.register('sem-shell', SemShell);
