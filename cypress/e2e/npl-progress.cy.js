// BDD spec — npl-progress · source: syntax/schema/npl-progress.md
//
// Feature: npl-progress renders a meter from data-value (0..1) with an
//          accessible text alternative, pre-set roles JS-off
//   Scenario: fill width and percentage text follow data-value
//   Scenario: label renders with the percentage
//   Scenario: out-of-range value clamps in render, raw attr untouched
//   Scenario: meter roles authored for AT without JS

describe('npl-progress', () => {
  beforeEach(() => cy.visit('/demo/index.html'));

  it('fill width and percentage text follow data-value', () => {
    cy.get('#p-coverage .npl-progress-fill').should(($el) => {
      const w = parseFloat($el.css('width'));
      expect(w).to.be.greaterThan(0);
    });
    cy.get('#p-coverage').should('contain', '62%');
  });

  it('label renders with the percentage', () => {
    cy.get('#p-coverage').should('contain', 'coverage');
  });

  it('out-of-range value clamps in render, raw attr untouched', () => {
    cy.get('#p-clamp').should('have.attr', 'data-value', '1.4');
    cy.get('#p-clamp .npl-progress-fill')
      .invoke('css', 'width').then((w) => {
        const track = Cypress.$('#p-clamp .npl-progress-track')[0];
        expect(parseFloat(w)).to.be.at.most(track.getBoundingClientRect().width + 0.5);
      });
    cy.get('#p-clamp').should('contain', '100%');
  });

  it('meter roles authored for AT without JS', () => {
    cy.get('#p-coverage')
      .should('have.attr', 'role', 'meter')
      .and('have.attr', 'aria-valuenow', '0.62')
      .and('have.attr', 'aria-valuemax', '1');
  });
});
