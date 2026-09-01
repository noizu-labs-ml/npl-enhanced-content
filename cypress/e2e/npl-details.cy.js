// BDD spec — npl-details / npl-detail / highlight · source: syntax/schema/npl-details.md
//
// Feature: npl-details presents prose whose highlights are recall targets;
//          quiz view occludes them (reveal per item), plain view emphasizes;
//          JS-off stays readable; the Lit upgrade supersedes the fallback
//   Scenario: quiz view — highlights occluded, click reveals
//   Scenario: quiz view — keyboard reveal (Enter)
//   Scenario: plain view — highlights emphasized, no occlusion
//   Scenario: JS-off — highlights visible, no occlusion
//   Scenario: Lit upgrade — <npl-details> occludes + reveals, no fallback marker

describe('npl-details', () => {
  describe('v0.4 class baseline (demo/index.html)', () => {
    beforeEach(() => cy.visit('/demo/index.html'));

    it('quiz view: highlights occluded, click reveals per item', () => {
      const dt = '.npl-details[data-view-as="quiz"] ';
      cy.get(dt + '.npl-occluded').should('have.length.at.least', 2);
      cy.get(dt + '.npl-occluded').first()
        .should('have.attr', 'role', 'button')
        .and('have.attr', 'aria-label', 'reveal');
      cy.get(dt + '.npl-highlight.npl-revealed').should('not.exist');
      cy.get(dt + '.npl-occluded').first().click();
      cy.get(dt + '.npl-highlight.npl-revealed').should('contain', 'Authorization');
      // unrevealed siblings stay occluded
      cy.get(dt + '.npl-occluded').should('have.length', 1);
    });

    it('quiz view: keyboard reveal with Enter', () => {
      const dt = '.npl-details[data-view-as="quiz"] ';
      cy.get(dt + '.npl-occluded').first().focus().type('{enter}');
      cy.get(dt + '.npl-highlight.npl-revealed').should('exist');
    });

    it('plain view: highlights emphasized, nothing occluded', () => {
      const dt = '.npl-details:not([data-view-as="quiz"]) ';
      cy.get(dt + '.npl-highlight').should('be.visible');
      cy.get(dt + '.npl-occluded').should('not.exist');
      cy.get('.npl-details:not([data-view-as="quiz"])')
        .should('not.have.attr', 'data-npl-fallback');
    });

    it('JS-off: highlights readable, no occlusion in either view', () => {
      cy.visit('/demo/index.html', {
        onBeforeLoad(win) { win.__nplJsOff = true; }
      });
      cy.get('.npl-details .npl-highlight').should('be.visible');
      cy.get('.npl-occluded').should('not.exist');
      cy.get('.npl-details[data-npl-fallback]').should('not.exist');
    });
  });

  describe('Lit upgrade (demo/standalone-lit.html)', () => {
    beforeEach(() => cy.visit('/demo/standalone-lit.html'));

    it('registers and upgrades npl-details (Lit ran, no fallback marker)', () => {
      cy.window().then((win) => {
        expect(win.customElements.get('npl-details')).to.exist;
      });
      cy.get('main npl-details[data-view-as="quiz"]')
        .should('have.attr', 'data-npl-upgraded');
      cy.get('main npl-details').should('not.have.attr', 'data-npl-fallback');
    });

    it('quiz view: highlights occluded after upgrade, click reveals', () => {
      const dt = 'npl-details[data-view-as="quiz"] ';
      cy.get(dt + '.npl-occluded').should('have.length.at.least', 1);
      cy.get(dt + '.npl-occluded').first().click();
      cy.get(dt + '.npl-highlight.npl-revealed').should('exist');
    });

    it('plain view: highlights stay readable', () => {
      cy.get('npl-details:not([data-view-as="quiz"]) .npl-highlight')
        .should('be.visible');
      cy.get('npl-details:not([data-view-as="quiz"]) .npl-occluded')
        .should('not.exist');
    });
  });
});
