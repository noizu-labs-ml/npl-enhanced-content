/**
 * fallback/note — `.sem-note[collapsed]` summary toggle.
 *
 * Marks the note with `data-sem-fallback` (the CSS hide-rule for the body is
 * gated on that marker, so a note stays fully readable when this script never
 * runs) and inserts a ten-word teaser that expands on click.
 */

export function enhanceNote(scope: ParentNode): void {
  scope.querySelectorAll('.sem-note[collapsed]').forEach((n) => {
    const body = n.querySelector('.sem-note-body');
    if (!body) return;
    n.setAttribute('data-sem-fallback', '');
    const sum = document.createElement('div');
    sum.className = 'sem-note-summary';
    sum.textContent = (body.textContent || '').trim().split(/\s+/).slice(0, 10).join(' ') + ' …';
    n.insertBefore(sum, body);
    sum.addEventListener('click', () => {
      n.removeAttribute('collapsed');
      sum.remove();
    });
  });
}
