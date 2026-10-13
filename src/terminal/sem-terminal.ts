import { html, type TemplateResult } from 'lit';
import { SemElement } from '../lit/base.js';
import { TerminalCore, type ShellLine, type WindowAction } from './terminal-core.js';

/**
 * sem-terminal — the reusable terminal core: input, history, transcript,
 * prompt, command dispatch. Knows nothing about SemText; its commands come
 * from plugins.
 *
 * Plugins arrive two ways, per src/terminal/PLUGINS.md:
 *
 *   - programmatically: `el.core.mountPlugin(manifestObject)` — bundled
 *     JS-object manifests, no fetch;
 *   - declaratively: the `plugins` attribute, a space-separated list of
 *     manifest URLs (an integrity hash rides the URL as a fragment:
 *     `…manifest.json#sha256-<hex>`). Each URL loads independently — one
 *     failing prints a stderr line and lands in `core.loadErrors` without
 *     touching the others.
 *
 * Light DOM per PRD §4 rule 5 / SemElement: `themes/_vocabulary.css`
 * styles the `.sem-shell-*` classes; no shadow root, no `static styles`.
 * Transcript lines render through Lit text bindings only (auto-escaped) —
 * no HTML is ever built from user input.
 *
 * Zero-JS contract: whatever is authored inside the element is the static
 * transcript (a role="log" div with past lines, NO input element); the
 * first connect replaces it once. See web/demo/shell.html, whose build
 * also emits a script-stripped `.nojs.html` proving the fallback.
 */
export class SemTerminal extends SemElement {
  static properties = {
    cwd: { type: String, state: true },
    lines: { type: Array, state: true },
    plugins: { type: String },
  };

  declare cwd: string;
  declare lines: ShellLine[];
  /**
   * Space-separated manifest URLs to load on connect. Integrity rides the
   * URL fragment: `https://cdn/…/manifest.json#sha256-<64 hex>`.
   */
  declare plugins: string;

  readonly core = new TerminalCore();

  #history: string[] = [];
  #historyIndex = -1;
  #draft = '';
  #booted = false;

  constructor() {
    super();
    this.cwd = this.core.state.cwd;
    this.lines = [];
    this.plugins = '';
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('aria-label', 'Terminal');
    if (!this.#booted) {
      this.#booted = true;
      this.replaceChildren(); // the authored zero-JS transcript is replaced
      this.lines = [{ kind: 'stdout', text: 'sem-terminal — type help.' }];
      this.#loadPluginsAttribute();
    }
  }

  /** Load every declared manifest URL; failures are isolated + recorded. */
  #loadPluginsAttribute(): void {
    for (const url of this.plugins.split(/\s+/)) {
      if (url === '') continue;
      void this.core.loadPluginFromUrl(url).then((result) => {
        if (result.ok && result.plugin) {
          this.appendLines([{ kind: 'stdout', text: `plugin loaded: ${result.plugin.name} ${result.plugin.version}` }]);
        } else {
          this.appendLines([{ kind: 'stderr', text: `plugin ${url}: ${result.error}` }]);
        }
      });
    }
  }

  render(): TemplateResult {
    return html`
      <div class="sem-shell-frame" @click=${this.#focusInput}>
        <div class="sem-shell-transcript" role="log" aria-live="polite" aria-label="Shell transcript">
          ${this.lines.map((line) => this.#renderLine(line))}
        </div>
        <form class="sem-shell-prompt" @submit=${this.#onSubmit}>
          <label class="sem-shell-ps1" for="sem-shell-input">${this.cwd} $</label>
          <input
            id="sem-shell-input"
            class="sem-shell-input"
            type="text"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            aria-label="Shell command"
            @keydown=${this.#onKeydown}
          />
        </form>
      </div>
    `;
  }

  #renderLine(line: ShellLine): TemplateResult {
    const cls =
      line.kind === 'cmd'
        ? 'sem-shell-line sem-shell-cmd'
        : line.kind === 'stderr'
          ? 'sem-shell-line sem-shell-error'
          : 'sem-shell-line';
    return html`<div class=${cls}>${line.text}</div>`;
  }

  appendLines(newLines: ShellLine[]): void {
    this.lines = [...this.lines, ...newLines];
  }

  #focusInput(): void {
    this.#inputEl()?.focus();
  }

  #inputEl(): HTMLInputElement | null {
    return this.querySelector('.sem-shell-input') as HTMLInputElement | null;
  }

  #onSubmit(event: Event): void {
    event.preventDefault();
    const input = this.#inputEl();
    if (!input) return;
    const value = input.value;
    input.value = '';
    this.#exec(value);
  }

  #exec(value: string): void {
    const result = this.core.execLine(value);
    this.cwd = result.state.cwd;
    if (result.clear) {
      this.lines = [];
    } else {
      this.appendLines(result.lines);
    }
    if (value.trim() !== '') {
      this.#history.push(value);
      this.#draft = '';
      this.#historyIndex = -1;
    }
    for (const action of result.actions) {
      if (action.kind === 'window') this.#openWindow(action);
    }
  }

  /**
   * The only side effect the core can request: content into a new window.
   * The blob carries exactly the bytes the command emitted (a stored
   * virtual file, verbatim — nothing built from user input);
   * `noopener,noreferrer` cuts the window-opener channel both ways.
   */
  #openWindow(action: WindowAction): void {
    const view = this.ownerDocument?.defaultView ?? window;
    const url = view.URL.createObjectURL(new view.Blob([action.blob], { type: action.contentType }));
    const win = view.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      this.appendLines([{ kind: 'stderr', text: `open: ${action.filename}: the browser blocked the pop-up window` }]);
    }
    view.setTimeout(() => view.URL.revokeObjectURL(url), 60_000);
  }

  #onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.#navigate(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.#navigate(1);
    } else if (event.key === 'l' && event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      this.lines = [];
    }
  }

  /** Up/down through history; down past the newest restores the draft. */
  #navigate(delta: number): void {
    const input = this.#inputEl();
    if (!input || this.#history.length === 0) return;
    if (this.#historyIndex === -1) {
      if (delta > 0) return;
      this.#draft = input.value;
      this.#historyIndex = this.#history.length - 1;
    } else {
      this.#historyIndex += delta;
      if (this.#historyIndex >= this.#history.length) {
        this.#historyIndex = -1;
        input.value = this.#draft;
        return;
      }
      if (this.#historyIndex < 0) this.#historyIndex = 0;
    }
    input.value = this.#history[this.#historyIndex];
  }
}

SemElement.register('sem-terminal', SemTerminal);
