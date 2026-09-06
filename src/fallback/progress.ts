/**
 * fallback/progress — `.sem-progress[data-value]` meter render.
 *
 * The value is clamped into [0,1] and a non-numeric value reads as 0, so an
 * authoring typo degrades to an empty bar rather than a broken layout. The
 * `label :: NN%` text and the clamp are asserted by
 * cypress/e2e/npl-progress.cy.js.
 */

export function enhanceProgress(scope: ParentNode): void {
  scope.querySelectorAll('.sem-progress[data-value]').forEach((p) => {
    const raw = parseFloat(p.getAttribute('data-value') as string);
    const v = Math.min(1, Math.max(0, isNaN(raw) ? 0 : raw));
    const label = p.getAttribute('data-label') || 'progress';
    const pct = Math.round(v * 100);
    p.textContent = label + ' :: ' + pct + '%';
    const track = document.createElement('span');
    track.className = 'sem-progress-track';
    const fill = document.createElement('span');
    fill.className = 'sem-progress-fill';
    fill.style.width = pct + '%';
    track.appendChild(fill);
    p.appendChild(track);
  });
}
