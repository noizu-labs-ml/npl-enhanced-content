// BDD spec — npl-facts / npl-fact · source: syntax/schema/npl-facts.md
//
// Feature: npl-facts presents fact/claim pairs as list, flashcards, or
//          quiz; JS-off degrades to a fully readable list; the Lit
//          upgrade supersedes the fallback behavior
//   Scenario: list view (default) — all facts visible, no chrome
//   Scenario: flashcards — one card at a time, flip reveals conclusion
//   Scenario: flashcards — meter uses .sem-facts-meter, wraps around
//   Scenario: quiz — conclusion hidden until correct selection, scored
//   Scenario: quiz — wrong pick marked, counts as answered
//   Scenario: D1 — .sem-progress element and facts meter coexist
//   Scenario: JS-off — all conclusions visible in every view
//   Scenario: Lit upgrade — <npl-facts> owns behavior, no fallback marker

describe('npl-facts', () => {
  describe('v0.4 class baseline (demo/index.html)', () => {
    beforeEach(() => cy.visit('/demo/index.html'));

    it('list view (default): all facts visible, no chrome, no fallback marker', () => {
      cy.get('#facts-list .sem-fact').should('have.length', 2);
      cy.get('#facts-list .sem-fact .sem-conclusion').should('be.visible');
      cy.get('#facts-list .sem-facts-chrome').should('not.exist');
      cy.get('#facts-list').should('not.have.attr', 'data-sem-fallback');
    });

    it('flashcards: one card at a time, flip reveals conclusion', () => {
      const fc = '.sem-facts[data-view-as="flashcards"] ';
      cy.get(fc + '.sem-fact.sem-current').should('have.length', 1);
      cy.get(fc + '.sem-current .sem-conclusion').should('not.be.visible');
      cy.get(fc + '.sem-current').click();
      cy.get(fc + '.sem-current.sem-flipped .sem-conclusion').should('be.visible');
    });

    it('flashcards: meter counts position, prev wraps to last card', () => {
      const fc = '.sem-facts[data-view-as="flashcards"] ';
      cy.get(fc + '.sem-facts-meter').should('contain', '1/3');
      cy.get(fc + '[data-act="prev"]').click();
      cy.get(fc + '.sem-facts-meter').should('contain', '3/3');
      cy.get(fc + '[data-act="next"]').click();
      cy.get(fc + '.sem-facts-meter').should('contain', '1/3');
    });

    it('quiz: conclusion hidden until correct selection, then scored', () => {
      const qz = '.sem-facts[data-view-as="quiz"] ';
      cy.get(qz + '.sem-fact .sem-conclusion').should('not.be.visible');
      cy.get(qz + '.sem-current .sem-quiz-options button').should('have.length.at.least', 2);
      cy.get(qz + '.sem-current .sem-quiz-options button[data-correct="true"]').click();
      cy.get(qz + '.sem-facts-meter').should('contain', 'score 1/1');
    });

    it('quiz: wrong pick marked wrong, answered once', () => {
      const qz = '.sem-facts[data-view-as="quiz"] ';
      cy.get(qz + '.sem-current .sem-quiz-options button[data-correct="false"]').first().click();
      cy.get(qz + '.sem-current .sem-quiz-options button.sem-wrong-pick').should('have.length', 1);
      cy.get(qz + '.sem-facts-meter').should('contain', 'score 0/1');
      // answered — further clicks change nothing
      cy.get(qz + '.sem-current .sem-quiz-options button').first().click();
      cy.get(qz + '.sem-facts-meter').should('contain', 'score 0/1');
    });

    it('D1: .sem-progress element and facts chrome meter coexist without collision', () => {
      // the meter element renders its track under its own class…
      cy.get('#p-coverage.sem-progress').should('contain', 'coverage :: 62%');
      cy.get('#p-coverage .sem-progress-track').should('exist');
      // …while the facts chrome label is a different class entirely
      cy.get('.sem-facts[data-view-as="flashcards"] .sem-facts-meter').should('contain', '1/3');
      cy.get('.sem-facts-chrome .sem-progress').should('not.exist');
      // and the meter element is untouched by facts chrome
      cy.get('#p-coverage .sem-facts-meter').should('not.exist');
    });

    it('JS-off: every view degrades to readable list, no occlusion', () => {
      cy.visit('/demo/index.html', {
        onBeforeLoad(win) { win.__nplJsOff = true; }
      });
      cy.get('.sem-facts[data-view-as="flashcards"] .sem-fact .sem-conclusion')
        .should('be.visible');
      cy.get('.sem-facts[data-view-as="quiz"] .sem-fact .sem-conclusion')
        .should('be.visible');
      cy.get('.sem-facts .sem-facts-chrome').should('not.exist');
      cy.get('.sem-facts[data-sem-fallback]').should('not.exist');
    });
  });

  describe('Lit upgrade (demo/standalone-lit.html)', () => {
    beforeEach(() => cy.visit('/demo/standalone-lit.html'));

    it('registers and upgrades npl-facts (Lit ran, no fallback marker)', () => {
      cy.window().then((win) => {
        expect(win.customElements.get('npl-facts')).to.exist;
      });
      cy.get('main npl-facts').should('have.attr', 'data-sem-upgraded');
      cy.get('main npl-facts').should('not.have.attr', 'data-sem-fallback');
    });

    it('flashcards: one current card, flip reveals conclusion', () => {
      const fc = 'npl-facts[data-view-as="flashcards"] ';
      cy.get(fc + '.sem-fact.sem-current').should('have.length', 1);
      cy.get(fc + '.sem-current .sem-conclusion').should('not.be.visible');
      cy.get(fc + '.sem-current').click();
      cy.get(fc + '.sem-current.sem-flipped .sem-conclusion').should('be.visible');
      cy.get(fc + '.sem-facts-meter').should('contain', '1/2');
    });

    it('quiz: conclusion hidden, correct pick scores', () => {
      const qz = 'npl-facts[data-view-as="quiz"] ';
      cy.get(qz + '.sem-current .sem-conclusion').should('not.be.visible');
      cy.get(qz + '.sem-current .sem-quiz-options button[data-correct="true"]').click();
      cy.get(qz + '.sem-facts-meter').should('contain', 'score 1/1');
    });
  });
});
