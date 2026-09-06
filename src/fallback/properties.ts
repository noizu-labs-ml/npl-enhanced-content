/**
 * fallback/properties — duplicate `data-key` diagnostic.
 *
 * Non-fatal by design: a duplicate key is an authoring mistake, not a reason
 * to hide content, so this warns and renders everything. The message text is
 * asserted by cypress/e2e/sem-properties.cy.js.
 */

export function enhanceProperties(scope: ParentNode): void {
  scope.querySelectorAll('.sem-properties').forEach((root) => {
    const seen: Record<string, boolean> = {};
    root.querySelectorAll('.sem-property[data-key]').forEach((p) => {
      const k = p.getAttribute('data-key') as string;
      if (seen[k]) console.warn('sem-properties: duplicate data-key "' + k + '"');
      seen[k] = true;
    });
  });
}
