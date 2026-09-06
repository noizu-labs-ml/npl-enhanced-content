/**
 * fallback/views — `.sem-views[id]` tab bar, arrow-key navigation and
 * `#<container-id>/<view>` deep links.
 *
 * The hash write stays a whole-hash assignment, matching the original inline
 * handler exactly: the deep-link format and the `sem-navigate` CustomEvent
 * payload are both asserted by test/e2e/sem-views.cy.js.
 */

export function enhanceViews(scope: ParentNode): void {
  scope.querySelectorAll<HTMLElement>('.sem-views[id]').forEach((root) => {
    const views = Array.from(root.querySelectorAll<HTMLElement>('.sem-view'));
    if (!views.length) return;
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

    function activate(k: number, focus?: boolean): void {
      active = k;
      views.forEach((v, j) => {
        if (j === k) v.setAttribute('data-active', ''); else v.removeAttribute('data-active');
      });
      Array.prototype.forEach.call(bar.querySelectorAll('[role="tab"]'), (b: Element, j: number) => {
        b.setAttribute('aria-selected', String(j === k));
      });
      const v = views[k];
      if (v.id) location.hash = root.id + '/' + v.id;
      else location.hash = root.id + '/' + (v.getAttribute('data-name') || '').toLowerCase();
      v.dispatchEvent(new CustomEvent('sem-navigate', {
        bubbles: true, detail: { id: root.id, name: v.getAttribute('data-name'), index: k },
      }));
      if (focus) (bar.querySelectorAll('[role="tab"]')[k] as HTMLElement).focus();
    }

    function fromHash(): void {
      const m = location.hash.match(new RegExp('^#' + root.id + '/(.+)$'));
      if (!m) return;
      const k = views.findIndex(
        (v) => v.id === m[1] || (v.getAttribute('data-name') || '').toLowerCase() === m[1],
      );
      if (k >= 0 && k !== active) activate(k);
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
  });
}
