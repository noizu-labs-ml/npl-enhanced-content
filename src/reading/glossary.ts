/**
 * reading/glossary — `sem-properties view-as="glossary"` term previews.
 *
 * Spec: spec/schema/sem-properties.md (glossary view). Anchors anywhere in
 * the document whose href targets a property `id` inside a glossary block
 * get `.sem-properties-ref` and a preview showing key + value. Idempotent
 * per anchor. Lives in the reading bundle, not the fallback core, to keep
 * the core inside its 12 KB budget (decision recorded in ROADMAP R/W1).
 * Returns whether the block was a glossary so the caller can mark it.
 */

import { param } from '../shared/attr.js';
import { attachPreview, cloneContent } from '../shared/popover.js';
import { citers } from './references.js';

export const PROPERTIES = ':is(sem-properties, .sem-properties)';
const PROPERTY = ':is(sem-property, .sem-property)';

function preview(prop: Element): DocumentFragment {
  const frag = document.createDocumentFragment();
  const key = param(prop, 'key');
  if (key) {
    const term = document.createElement('strong');
    term.className = 'sem-popover-term';
    term.textContent = key;
    frag.appendChild(term);
  }
  frag.appendChild(cloneContent(prop, '.sem-popover'));
  return frag;
}

export function enhanceGlossaryElement(root: Element): boolean {
  if ((param(root, 'view-as') || '') !== 'glossary') return false;
  root.querySelectorAll(':scope > ' + PROPERTY + '[id]').forEach((prop) => {
    citers(prop.id, root).forEach((a) => {
      if (a.classList.contains('sem-properties-ref')) return;
      a.classList.add('sem-properties-ref');
      attachPreview(a, () => preview(prop));
    });
  });
  return true;
}
