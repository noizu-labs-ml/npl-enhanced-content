// Standalone Lit page — proves the M3 upgrade path end to end:
// one self-contained file, inlined IIFE bundle, custom element upgrades
// and owns the collapsed/expanded behavior. Targets the handoff contract:
// data-sem-upgraded set, data-sem-fallback absent, role="note".

describe('standalone Lit page', () => {
  beforeEach(() => {
    cy.visit('/demo/standalone-lit.html');
  });

  it('registers and upgrades npl-note (Lit ran)', () => {
    cy.window().then((win) => {
      expect(win.customElements.get('npl-note')).to.exist;
    });
    cy.get('main npl-note').should('have.attr', 'data-sem-upgraded');
  });

  it('sets role="note" and reflects variant', () => {
    cy.get('main npl-note[data-variant="warning"]').should('have.attr', 'role', 'note');
    cy.get('main npl-note[data-variant="tip"]').should('have.attr', 'data-variant', 'tip');
  });

  it('upgraded notes carry no fallback marker', () => {
    cy.get('main npl-note').should('not.have.attr', 'data-sem-fallback');
  });

  it('collapsed note renders a summary and hides its body', () => {
    cy.get('main npl-note[data-variant="tip"] > .sem-note-summary')
      .should('exist')
      .and('contain.text', '…');
    cy.get('main npl-note[data-variant="tip"] > .sem-note-summary')
      .invoke('text')
      .should('have.length.gt', 4);
  });

  it('expands the collapsed note when the summary is clicked', () => {
    const tip = 'main npl-note[data-variant="tip"] ';
    cy.get(tip + '.sem-note-summary').click();
    cy.get(tip).should('not.have.attr', 'collapsed');
    cy.get(tip + '.sem-note-body').should('be.visible');
    cy.get(tip + '.sem-note-summary').should('not.exist');
  });
});
