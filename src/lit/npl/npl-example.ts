import { html } from 'lit';
import { SemElement } from '../base.js';
import { defineNpl, nplEmit, nplParam } from './shared.js';

/**
 * npl-example — display-only placeholder proving the NPL component pattern
 * end to end. Delete it once real components exist (and its schema file
 * spec/schema/npl/npl-example.md); the pattern it demonstrates stays:
 *
 *   - extend SemElement — light DOM (no shadow root, no static styles),
 *     the `data-sem-upgraded` claim, afterParse, whenChildrenReady;
 *   - reactive `static properties` for parameters, mirrored to the
 *     `data-*` spelling in `updated()` via afterParse (the dual-form
 *     contract sem-note's variant follows; a parse-time write would leak
 *     into a sem-source snapshot, hence afterParse);
 *   - render() for display-only output; authored children survive beside
 *     it (light DOM);
 *   - `defineNpl('<tag>', <Class>);` as the file's last line;
 *   - registration + the two-line import pair in ./index.ts, one CSS box
 *     line in the npl section of themes/_vocabulary.css, one schema file
 *     per spec/schema/npl/TEMPLATE.md, one unit spec per
 *     test/unit/npl-foundation.test.ts.
 */
export class NplExample extends SemElement {
  static properties = {
    label: { type: String, reflect: true },
  };

  declare label: string;

  constructor() {
    super();
    this.label = 'npl-example';
  }

  updated(): void {
    // dual-form contract: the data-* spelling mirrors the bare attribute,
    // so CSS/extraction read one form (deferred past parse, like sem-note).
    this.afterParse('label', () => this.setAttribute('data-label', this.label));
  }

  render() {
    return html`<span class="npl-example-label">${nplParam(this, 'label', this.label)}</span>`;
  }

  /** Event contract demo: `npl-example-seen`, bubbles + composed. */
  announce(): boolean {
    return nplEmit(this, 'example-seen', { label: this.label });
  }
}

defineNpl('npl-example', NplExample);
