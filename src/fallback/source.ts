/**
 * fallback/source — snapshot every sem-source's authored markup.
 *
 * Registered FIRST in the handler list: the snapshot must see the subtree
 * before any handler adds chrome, wraps lines or sets `hidden`. The copy
 * lives in an inert `script.sem-source-raw[type="text/plain"]` child so
 * the reading bundle (a separate IIFE) can read it; extraction skips it.
 * Idempotent. Spec: spec/schema/sem-source.md.
 */

export function enhanceSource(scope: ParentNode): void {
  scope.querySelectorAll(':is(sem-source, .sem-source)').forEach((el) => {
    if (el.querySelector(':scope > script.sem-source-raw')) return;
    const s = document.createElement('script');
    s.type = 'text/plain';
    s.className = 'sem-source-raw';
    s.textContent = el.innerHTML.replace(/<\/script/gi, '<\\/script');
    el.insertBefore(s, el.firstChild);
  });
}
