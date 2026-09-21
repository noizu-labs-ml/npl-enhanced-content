/**
 * fallback/audience — profile-gated visibility.
 *
 * Contract: spec/schema/sem-audiences.md. The matching itself lives in
 * shared/audience (pure, fail-open); this module only decides WHERE the
 * active profile comes from and WHAT to do with a `false`: set the native
 * `hidden` attribute. No class, no inline style, no marker — so a theme
 * needs no rule and extraction, which never reads `hidden`, is unaffected.
 *
 * Active profile: hash parameter `sem-audience` (shared/state, so it composes
 * with the sem-views bare segment), else the author's default `data-audience`
 * on the root wrapper or on `<html>`. The resolved profile is reflected onto
 * `<html data-audience>`, which is where the Lit tier reads it. Re-resolved
 * on every `hashchange`.
 */

import { closureFor, matches } from '../shared/audience.js';
import { getParam } from '../shared/state.js';

const WRAPPER = 'sem-enhanced-document, .sem-enhanced-document';

export function enhanceAudience(scope: ParentNode): void {
  const html = document.documentElement;
  const wrapper = document.querySelector(WRAPPER);
  // The author's default, captured once: after the first apply, the html
  // attribute holds the resolved profile, not the default.
  const authored =
    (wrapper && (wrapper.getAttribute('data-audience') || wrapper.getAttribute('audience'))) ||
    html.getAttribute('data-audience');
  const closure = closureFor(document);

  const apply = (): void => {
    const active = getParam('sem-audience') || authored || null;
    if (active) html.setAttribute('data-audience', active);
    else html.removeAttribute('data-audience');
    scope.querySelectorAll<HTMLElement>('[data-audience], [audience]').forEach((el) => {
      if (el === html || el === wrapper) return; // default markers, not restrictions
      const spec = el.getAttribute('data-audience') ?? el.getAttribute('audience');
      el.toggleAttribute('hidden', !matches(spec, active, closure));
    });
  };

  window.addEventListener('hashchange', apply);
  apply();
}
