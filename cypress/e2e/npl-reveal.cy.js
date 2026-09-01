// BDD spec — npl-reveal · source: syntax/schema/npl-reveal.md
//
// Feature: npl-reveal discloses body under a summary, native details
//          semantics after fallback wrap, fully visible JS-off
//   Scenario: data-summary becomes the toggle label; body hidden when collapsed
//   Scenario: clicking summary reveals body
//   Scenario: first-line summary derived when data-summary absent
//   Scenario: JS-off — body visible regardless of collapsed

describe('npl-reveal', () => {
  beforeEach(() => cy.visit('/demo/index.html'));

  it('data-summary becomes the toggle label; collapsed hides body', () => {
    cy.get('#r-storage details summary').should('contain', 'Why not localStorage?');
    cy.get('#r-storage details').should('not.have.attr', 'open');
    cy.get('#r-storage details .npl-reveal-body').should('not.be.visible');
  });

  it('clicking summary reveals body', () => {
    cy.get('#r-storage details summary').click();
    cy.get('#r-storage details .npl-reveal-body').should('be.visible');
  });

  it('first-line summary derived when data-summary absent', () => {
    cy.get('#r-derived details summary')
      .should('contain', 'Refresh tokens rotate per use');
  });
});
