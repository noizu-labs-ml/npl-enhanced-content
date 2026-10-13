import { param } from '../../shared/attr.js';
import { SemElement } from '../base.js';
import { defineNpl } from './shared.js';

/**
 * npl-vos — display-only bracket for an NPL vector-of-self block: the
 * psychodynamic state (id, ego, mood, super-ego, optional collective) an
 * NPL persona brackets each substantive response with. Source: NPL
 * `vos` blocks; `phase` marks which half of the bracket (`entry` or
 * `exit`). No events, no behaviour — rows only.
 *
 * Parts are authored as direct child elements carrying their part name
 * (`data-vos="<part>"`, bare `vos="<part>"` also read; `data-` wins, the
 * shared dual-form rule). The element renders a phase label then one
 * labelled row per part in the canonical order — authored order is not
 * relied on — moving each authored element whole into its row body, so
 * content stays light-DOM searchable and copyable.
 */
const VOS_PARTS = ['id', 'ego', 'mood', 'super-ego', 'collective'];

export class NplVos extends SemElement {
  static properties = {
    phase: { type: String, reflect: true },
  };

  declare phase: string;

  #awaitingParts = false;

  constructor() {
    super();
    this.phase = '';
  }

  updated(): void {
    // dual-form contract: the data-* spelling mirrors the bare attribute,
    // so CSS/extraction read one form (deferred past parse, like sem-note).
    this.afterParse('phase', () => this.setAttribute('data-phase', this.phase));
    if (this.#parts().length > 0) {
      this.#assemble();
      return;
    }
    // element upgraded pre-parse: children aren't there yet at first update
    this.#awaitParts();
  }

  /** Authored part elements still unwrapped (direct children only). */
  #parts(): Element[] {
    return Array.from(this.querySelectorAll(':scope > :is([data-vos], [vos])'));
  }

  /**
   * Build the bracket: one labelled row per authored part, rows in the
   * canonical part order, phase label leading. Idempotent — wrapped parts
   * are not re-wrapped, rows are moved (appendChild), never rebuilt.
   */
  #assemble(): void {
    for (const part of this.#parts()) {
      const name = param(part, 'vos') ?? '';
      const row = document.createElement('div');
      row.className = 'npl-vos-row';
      row.setAttribute('data-vos-row', name);
      const label = document.createElement('span');
      label.className = 'npl-vos-row-label';
      label.textContent = name;
      const body = document.createElement('div');
      body.className = 'npl-vos-row-body';
      body.appendChild(part);
      row.append(label, body);
      this.appendChild(row);
    }
    for (const name of VOS_PARTS) {
      for (const row of this.#rowsNamed(name)) this.appendChild(row);
    }
    // parts outside the catalog still display — trailing the known five
    const known = new Set(VOS_PARTS);
    for (const row of this.querySelectorAll(':scope > .npl-vos-row')) {
      if (!known.has(row.getAttribute('data-vos-row') ?? '')) this.appendChild(row);
    }
    const phase = this.phase.trim();
    const label = this.querySelector(':scope > .npl-vos-phase');
    if (phase) {
      const lead = label ?? document.createElement('div');
      lead.className = 'npl-vos-phase';
      lead.textContent = phase;
      this.insertBefore(lead, this.firstChild);
    } else {
      label?.remove();
    }
  }

  #rowsNamed(name: string): Element[] {
    return Array.from(
      this.querySelectorAll(`:scope > .npl-vos-row[data-vos-row="${name}"]`),
    );
  }

  #awaitParts(): void {
    if (this.#awaitingParts) return;
    this.#awaitingParts = true;
    void this.whenChildrenReady(':scope > :is([data-vos], [vos])').then(() => {
      this.#awaitingParts = false;
      this.requestUpdate();
    });
  }
}

defineNpl('npl-vos', NplVos);
