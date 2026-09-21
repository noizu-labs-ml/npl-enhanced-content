/**
 * fallback/source — snapshot every sem-source's authored markup.
 *
 * Registered FIRST in the handler list: the snapshot must see the subtree
 * before any handler adds chrome, wraps lines or sets `hidden`. The copy
 * is a DOM CLONE of the children placed in an inert
 * `template.sem-source-raw` child — never a string: nothing is serialised
 * and re-parsed, so there is no HTML sink and no `</script` escaping. The
 * reading bundle (a separate IIFE) reads the template's content; template
 * content is not part of the document tree, so extraction, CSS and the
 * no-JS artifact never see it. Idempotent. Spec: spec/schema/sem-source.md.
 */

import { warn } from '../shared/audience.js';

const SOURCE = ':is(sem-source, .sem-source)';

export function enhanceSource(scope: ParentNode): void {
  scope.querySelectorAll(SOURCE).forEach((el) => {
    if (el.querySelector(':scope > template.sem-source-raw')) return;
    // Nested wrappers are unsupported: the inner markup is part of the outer's.
    if (el.parentElement?.closest(SOURCE)) { warn('sem-source: nested wrapper ignored'); return; }
    const t = document.createElement('template');
    t.className = 'sem-source-raw';
    el.childNodes.forEach((n) => t.content.appendChild(n.cloneNode(true)));
    el.insertBefore(t, el.firstChild);
  });
}
