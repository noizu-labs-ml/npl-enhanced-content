import { html } from 'lit';
import { SemElement } from '../base.js';
import { defineNpl } from './shared.js';

/**
 * npl-mode — display-only cognitive lens declaration. The authored `mode`
 * children (each with a required `type` attribute) enumerate the cognitive
 * lenses of an NPL agent; the component renders one chip per typed child,
 * labelled by its type, marking them all when the optional boolean
 * `primary` attribute declares this the primary lens. Pattern proven by
 * npl-example; the recipe stays:

 *   - extend SemElement — light DOM (no shadow root, no static styles),
 *     the `data-sem-upgraded` claim, afterParse, whenChildrenReady;
 *   - reactive `static properties` for parameters, mirrored to the
 *     `data-*` spelling in `updated()` via afterParse (the dual-form
 *     contract sem-note's variant follows; a parse-time write would leak
 *     into a sem-source snapshot, hence afterParse);
 *   - render() for display-only output; authored children survive beside
 *     it (light DOM);
 *   - `defineNpl('<tag>', <Class>);` as the file's last line.
 */
export class NplMode extends SemElement {
  static properties = {
    primary: { type: Boolean, reflect: true },
  };

  declare primary: boolean;

  constructor() {
    super();
    this.primary = false;
  }

  updated(): void {
    // dual-form contract: the data-* spelling mirrors the bare attribute,
    // so CSS/extraction read one form (deferred past parse, like sem-note).
    this.afterParse('primary', () => {
      if (this.primary) this.setAttribute('data-primary', '');
      else this.removeAttribute('data-primary');
    });
  }

  render() {
    // `mode[type]` — the type attribute is required; untyped children are
    // skipped. Authored children stay in the light DOM beside the chips.
    const modes = Array.from(this.querySelectorAll('mode[type]'));
    return html`${modes.map((mode) => {
      const type = mode.getAttribute('type') as string;
      return html`<span
        class="npl-mode-chip${this.primary ? ' npl-mode-chip-primary' : ''}"
        data-type="${type}"
        >${type}</span
      >`;
    })}`;
  }
}

defineNpl('npl-mode', NplMode);
