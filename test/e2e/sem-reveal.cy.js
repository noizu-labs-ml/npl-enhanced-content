// BDD spec — sem-reveal · source: spec/schema/sem-reveal.md
//
// Feature: sem-reveal discloses body under a summary, native details
//          semantics after fallback wrap, fully visible JS-off
//   Scenario: data-summary becomes the toggle label; body hidden when collapsed
//   Scenario: clicking summary reveals body
//   Scenario: first-line summary derived when data-summary absent
//   Scenario: JS-off — body visible regardless of collapsed

describe('sem-reveal', () => {
  beforeEach(() => cy.visit('/demo/index.html'));

  it('data-summary becomes the toggle label; collapsed hides body', () => {
    cy.get('#r-storage details summary').should('contain', 'Why not localStorage?');
    cy.get('#r-storage details').should('not.have.attr', 'open');
    cy.get('#r-storage details .sem-reveal-body').should('not.be.visible');
  });

  it('clicking summary reveals body', () => {
    cy.get('#r-storage details summary').click();
    cy.get('#r-storage details .sem-reveal-body').should('be.visible');
  });

  it('first-line summary derived when data-summary absent', () => {
    cy.get('#r-derived details summary')
      .should('contain', 'Refresh tokens rotate per use');
  });
});
