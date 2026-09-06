// BDD spec — sem-details / sem-detail / highlight · source: syntax/schema/sem-details.md
//
// Feature: sem-details presents prose whose highlights are recall targets;
//          quiz view occludes them (reveal per item), plain view emphasizes;
//          JS-off stays readable; the Lit upgrade supersedes the fallback
//   Scenario: quiz view — highlights occluded, click reveals
//   Scenario: quiz view — keyboard reveal (Enter)
//   Scenario: plain view — highlights emphasized, no occlusion
//   Scenario: JS-off — highlights visible, no occlusion
//   Scenario: Lit upgrade — <sem-details> occludes + reveals, no fallback marker

describe('sem-details', () => {
  describe('v0.4 class baseline (demo/index.html)', () => {
    beforeEach(() => cy.visit('/demo/index.html'));

    it('quiz view: highlights occluded, click reveals per item', () => {
      const dt = '.sem-details[data-view-as="quiz"] ';
      cy.get(dt + '.sem-occluded').should('have.length.at.least', 2);
      cy.get(dt + '.sem-occluded').first()
        .should('have.attr', 'role', 'button')
        .and('have.attr', 'aria-label', 'reveal');
      cy.get(dt + '.sem-highlight.sem-revealed').should('not.exist');
      cy.get(dt + '.sem-occluded').first().click();
      cy.get(dt + '.sem-highlight.sem-revealed').should('contain', 'Authorization');
      // unrevealed siblings stay occluded
      cy.get(dt + '.sem-occluded').should('have.length', 1);
    });

    it('quiz view: keyboard reveal with Enter', () => {
      const dt = '.sem-details[data-view-as="quiz"] ';
      cy.get(dt + '.sem-occluded').first().focus().type('{enter}');
      cy.get(dt + '.sem-highlight.sem-revealed').should('exist');
    });

    it('plain view: highlights emphasized, nothing occluded', () => {
      const dt = '.sem-details:not([data-view-as="quiz"]) ';
      cy.get(dt + '.sem-highlight').should('be.visible');
      cy.get(dt + '.sem-occluded').should('not.exist');
      cy.get('.sem-details:not([data-view-as="quiz"])')
        .should('not.have.attr', 'data-sem-fallback');
    });

    it('JS-off: highlights readable, no occlusion in either view', () => {
      cy.visit('/demo/index.html', {
        onBeforeLoad(win) { win.__semJsOff = true; }
      });
      cy.get('.sem-details .sem-highlight').should('be.visible');
      cy.get('.sem-occluded').should('not.exist');
      cy.get('.sem-details[data-sem-fallback]').should('not.exist');
    });
  });

  describe('Lit upgrade (demo/standalone-lit.html)', () => {
    beforeEach(() => cy.visit('/demo/standalone-lit.html'));

    it('registers and upgrades sem-details (Lit ran, no fallback marker)', () => {
      cy.window().then((win) => {
        expect(win.customElements.get('sem-details')).to.exist;
      });
      cy.get('main sem-details[data-view-as="quiz"]')
        .should('have.attr', 'data-sem-upgraded');
      cy.get('main sem-details').should('not.have.attr', 'data-sem-fallback');
    });

    it('quiz view: highlights occluded after upgrade, click reveals', () => {
      const dt = 'sem-details[data-view-as="quiz"] ';
      cy.get(dt + '.sem-occluded').should('have.length.at.least', 1);
      cy.get(dt + '.sem-occluded').first().click();
      cy.get(dt + '.sem-highlight.sem-revealed').should('exist');
    });

    it('plain view: highlights stay readable', () => {
      cy.get('sem-details:not([data-view-as="quiz"]) .sem-highlight')
        .should('be.visible');
      cy.get('sem-details:not([data-view-as="quiz"]) .sem-occluded')
        .should('not.exist');
    });
  });
});
