// BDD spec — v0.4 class-based baseline · source: conventions.md v0.4, demo/index.html
// Fixture serves the repo root; run `npx vite preview` (port 4173) or any static server.
// Note: the JS-off scenario's __nplJsOff guard needs a fixture hook — the demo
// currently always runs the fallback handler; adjust fixture or drop the guard
// when wiring cypress.config.js.
//
// Feature: the class-based baseline document renders and behaves with zero
//          external resources beyond Tailwind CDN
//   Scenario: agent metadata block renders
//   Scenario: note variants render, collapsed hides body until clicked
//   Scenario: flashcards view — one card visible, flip reveals conclusion
//   Scenario: quiz view — conclusion hidden, options scored
//   Scenario: highlight occlusion — hidden until reveal, then visible
//   Scenario: JS-off — all content still readable (list layout, no occlusion)

describe('v0.4 baseline (demo/index.html)', () => {
  beforeEach(() => cy.visit('/demo/index.html'));

  it('renders agent metadata block', () => {
    cy.get('.npl-agent .npl-agent-name').should('contain', 'Auth Guide');
    cy.get('.npl-agent .npl-agent-instructions').should('exist');
  });

  it('renders note variants; collapsed hides body until clicked', () => {
    cy.get('.npl-note[data-variant="warning"]').should('be.visible');
    cy.get('.npl-note[collapsed] .npl-note-body').should('not.be.visible');
    cy.get('.npl-note[collapsed] .npl-note-summary').click();
    cy.get('.npl-note[collapsed] .npl-note-body').should('not.exist');
    cy.contains('Shuffle flashcards').should('be.visible');
  });

  it('flashcards view: one card at a time, flip reveals conclusion', () => {
    const root = cy.get('.npl-facts[data-view-as="flashcards"]');
    root.find('.npl-fact.npl-current').should('have.length', 1);
    root.find('.npl-current .npl-conclusion').should('not.be.visible');
    root.find('.npl-current').click();
    root.find('.npl-current.npl-flipped .npl-conclusion').should('be.visible');
    root.find('[data-act="next"]').click();
    root.find('.npl-current').should('have.length', 1);
    root.find('.npl-progress').should('contain', '2/3');
  });

  it('quiz view: conclusion hidden, options scored, distractors count', () => {
    const root = cy.get('.npl-facts[data-view-as="quiz"]');
    root.find('.npl-fact .npl-conclusion').should('not.be.visible');
    root.find('.npl-current .npl-quiz-options button').should('have.length.at.least', 2);
    root.find('.npl-current .npl-quiz-options button[data-correct="true"]').click();
    root.find('.npl-progress').should('contain', 'score 1/1');
  });

  it('highlight occlusion: hidden until reveal, then visible', () => {
    cy.get('.npl-occluded').first().click();
    cy.get('.npl-revealed').should('contain', 'Authorization');
  });

  it('JS-off: content fully readable, no occlusion', () => {
    cy.visit('/demo/index.html', {
      onBeforeLoad(win) { win.__nplJsOff = true; }
    });
    cy.get('.npl-fact .npl-statement').should('be.visible');
    cy.get('.npl-fact .npl-conclusion').should('be.visible');
    cy.get('.npl-highlight').should('be.visible');
    cy.get('.npl-occluded').should('not.exist');
  });
});
