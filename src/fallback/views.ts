/**
 * fallback/views — `.sem-views[id]` tab bar, arrow-key navigation and
 * `#<container-id>/<view>` deep links.
 *
 * The deep link is the bare hash segment `<id>/<view>`; it is read and
 * written through shared/state so a named parameter beside it
 * (`&sem-audience=…`) survives a tab switch. Format and the `sem-navigate`
 * CustomEvent payload are asserted by test/e2e/sem-views.cy.js.
 *
 * Marks the container `data-sem-fallback`: the inactive-view hide rule is
 * gated on that marker (D12), so with no script every view renders stacked.
 *
 * `sem-activate` dispatched on a view (by fallback/target for a deep link
 * into a view's descendant) activates it WITHOUT rewriting the hash, so the
 * descendant's own anchor stays in the address bar.
 */

import { bareSegments, setBare } from '../shared/state.js';

export function enhanceViews(scope: ParentNode): void {
  scope.querySelectorAll<HTMLElement>('.sem-views[id]').forEach((root) => {
    const views = Array.from(root.querySelectorAll<HTMLElement>('.sem-view'));
    if (!views.length) return;
    root.setAttribute('data-sem-fallback', '');
    if (!root.querySelector('.sem-view[data-active]')) views[0].setAttribute('data-active', '');
    let active = Math.max(0, views.findIndex((v) => v.hasAttribute('data-active')));

    const bar = document.createElement('div');
    bar.className = 'sem-views-tabs';
    bar.setAttribute('role', 'tablist');
    views.forEach((v, k) => {
      v.setAttribute('role', 'tabpanel');
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.textContent = v.getAttribute('data-name');
      b.setAttribute('aria-selected', String(k === active));
      b.addEventListener('click', () => { activate(k); });
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); activate((active + 1) % views.length, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); activate((active - 1 + views.length) % views.length, true); }
      });
      bar.appendChild(b);
    });
    root.insertBefore(bar, root.firstChild);

    function activate(k: number, focus?: boolean, silent?: boolean): void {
      active = k;
      views.forEach((v, j) => {
        if (j === k) v.setAttribute('data-active', ''); else v.removeAttribute('data-active');
      });
      Array.prototype.forEach.call(bar.querySelectorAll('[role="tab"]'), (b: Element, j: number) => {
        b.setAttribute('aria-selected', String(j === k));
      });
      const v = views[k];
      if (!silent) setBare(root.id, v.id || (v.getAttribute('data-name') || '').toLowerCase());
      v.dispatchEvent(new CustomEvent('sem-navigate', {
        bubbles: true, detail: { id: root.id, name: v.getAttribute('data-name'), index: k },
      }));
      if (focus) (bar.querySelectorAll('[role="tab"]')[k] as HTMLElement).focus();
    }

    function fromHash(): void {
      const head = root.id + '/';
      const seg = bareSegments().find((b) => b.startsWith(head));
      if (!seg) return;
      const want = seg.slice(head.length);
      const k = views.findIndex(
        (v) => v.id === want || (v.getAttribute('data-name') || '').toLowerCase() === want,
      );
      if (k >= 0 && k !== active) activate(k);
    }
    window.addEventListener('hashchange', fromHash);
    root.addEventListener('sem-activate', (e) => {
      const k = views.indexOf(e.target as HTMLElement);
      if (k >= 0 && k !== active) activate(k, false, true);
    });
    fromHash();
  });
}
