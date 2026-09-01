// BDD spec — v0.4 class-based baseline · source: conventions.md v0.4, demo/index.html
// Fixture serves the repo root; run any static server on port 4173.
// The JS-off scenario uses the demo's `__nplJsOff` kill-switch hook.
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
    const fc = '.npl-facts[data-view-as="flashcards"] ';
    cy.get(fc + '.npl-fact.npl-current').should('have.length', 1);
    cy.get(fc + '.npl-current .npl-conclusion').should('not.be.visible');
    cy.get(fc + '.npl-current').click();
    cy.get(fc + '.npl-current.npl-flipped .npl-conclusion').should('be.visible');
    cy.get(fc + '[data-act="next"]').click();
    cy.get(fc + '.npl-current').should('have.length', 1);
    cy.get(fc + '.npl-progress').should('contain', '2/3');
  });

  it('quiz view: conclusion hidden, options scored, distractors count', () => {
    const qz = '.npl-facts[data-view-as="quiz"] ';
    cy.get(qz + '.npl-fact .npl-conclusion').should('not.be.visible');
    cy.get(qz + '.npl-current .npl-quiz-options button').should('have.length.at.least', 2);
    cy.get(qz + '.npl-current .npl-quiz-options button[data-correct="true"]').click();
    cy.get(qz + '.npl-progress').should('contain', 'score 1/1');
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
