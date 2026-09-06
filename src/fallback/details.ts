/**
 * fallback/details — `.sem-details[data-view-as="quiz"]` highlight occlusion.
 *
 * Replaces each `.sem-highlight` with a keyboard-reachable `.sem-occluded`
 * span that reveals on click or Enter/Space. Extracted verbatim from the
 * inline demo IIFE; src/lit/sem-details.ts holds the Lit-tier twin of
 * this logic (D5) and both must keep producing the same DOM.
 */

export function enhanceDetails(scope: ParentNode): void {
  scope.querySelectorAll('.sem-details[data-view-as="quiz"]').forEach((root) => {
    root.querySelectorAll('.sem-highlight').forEach((h) => {
      const span = document.createElement('span');
      span.className = 'sem-occluded';
      span.textContent = h.textContent;
      span.setAttribute('role', 'button');
      span.setAttribute('tabindex', '0');
      span.setAttribute('aria-label', 'reveal');
      const reveal = (): void => {
        span.className = 'sem-highlight sem-revealed';
        span.removeAttribute('role');
        span.removeAttribute('tabindex');
      };
      span.addEventListener('click', reveal);
      span.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); }
      });
      h.replaceWith(span);
    });
  });
}
