/**
 * fallback/reveal — wraps `.npl-reveal` content in native `<details>`.
 *
 * Native disclosure rather than a hand-rolled toggle: it is keyboard- and
 * screen-reader-correct for free, and find-in-page still reaches closed
 * content in browsers that support it. `collapsed` on the source element
 * means "start closed"; its absence means `open`.
 */

export function enhanceReveal(scope: ParentNode): void {
  scope.querySelectorAll('.npl-reveal').forEach((r) => {
    const d = document.createElement('details');
    if (!r.hasAttribute('collapsed')) d.setAttribute('open', '');
    const s = document.createElement('summary');
    s.textContent =
      r.getAttribute('data-summary') ||
      (r.textContent || '').trim().split(/\s+/).slice(0, 8).join(' ') + ' …';
    d.appendChild(s);
    const body = document.createElement('div');
    body.className = 'npl-reveal-body';
    while (r.firstChild) body.appendChild(r.firstChild);
    d.appendChild(body);
    r.appendChild(d);
  });
}
