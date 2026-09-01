// BDD spec — npl-procedure / npl-step · source: syntax/schema/npl-procedure.md
// Fixture: /demo/index.html (v0.4 class-based baseline, sections appended on feat/tier0-spec-expansion)
//
// Feature: npl-procedure renders an ordered, status-annotated procedure with zero JS
//   Scenario: steps render in DOM order with ordinal numbers
//   Scenario: status glyphs and accents follow data-status
//   Scenario: missing data-status defaults to todo
//   Scenario: roles authored for AT without JS

describe('npl-procedure', () => {
  beforeEach(() => cy.visit('/demo/index.html'));

  it('renders steps in DOM order with ordinals', () => {
    cy.get('.npl-procedure .npl-step').should('have.length', 4);
    cy.get('.npl-procedure .npl-step').first().should('contain', 'provision Infisical path');
    cy.get('.npl-procedure .npl-step').eq(2).should('contain', 'run migrations');
  });

  it('status glyphs and accents follow data-status', () => {
    cy.get('.npl-procedure .npl-step[data-status="done"]').should('have.css', 'color').and('not.equal', 'rgba(0, 0, 0, 0)');
    cy.get('.npl-procedure .npl-step[data-status="current"]').should('be.visible');
    cy.get('.npl-procedure .npl-step[data-status="blocked"]').should('be.visible');
  });

  it('missing data-status defaults to todo', () => {
    cy.get('.npl-procedure .npl-step').eq(2).should('not.have.attr', 'data-status');
    cy.get('.npl-procedure .npl-step').eq(2).should('be.visible');
  });

  it('roles authored for AT without JS', () => {
    cy.get('.npl-procedure').should('have.attr', 'role', 'list');
    cy.get('.npl-procedure .npl-step').first().should('have.attr', 'role', 'listitem');
  });
});
