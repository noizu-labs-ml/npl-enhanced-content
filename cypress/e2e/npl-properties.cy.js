// BDD spec — npl-properties / npl-property · source: syntax/schema/npl-properties.md
//
// Feature: npl-properties renders a key/value definition list with zero JS
//   Scenario: data-key renders as term, text as definition
//   Scenario: roles authored for AT without JS
//   Scenario: duplicate data-key logs a non-fatal warning

describe('npl-properties', () => {
  beforeEach(() => cy.visit('/demo/index.html'));

  it('renders data-key as term and text as definition', () => {
    cy.get('.sem-properties[data-kind="config"] .sem-property').should('have.length', 3);
    cy.get('.sem-property[data-key="token ttl"]').should('contain', '15m');
    cy.get('.sem-property[data-key="storage"]').should('contain', 'httpOnly cookie');
  });

  it('roles authored for AT without JS', () => {
    cy.get('.sem-properties .sem-property[data-key="token ttl"]')
      .should('have.attr', 'role', 'definition')
      .and('have.attr', 'aria-label', 'token ttl');
    cy.get('.sem-properties .sem-property[data-key="refresh rotation"]')
      .should('have.attr', 'role', 'definition');
  });

  it('duplicate data-key logs a non-fatal warning', () => {
    cy.visit('/demo/index.html', {
      onBeforeLoad(win) { cy.spy(win.console, 'warn'); }
    });
    // fixture block intentionally reuses data-key="token ttl"
    cy.get('#npl-props-dup .sem-property').should('have.length', 2);
    cy.window().its('console.warn').should('have.been.calledWithMatch', /duplicate/i);
  });
});
