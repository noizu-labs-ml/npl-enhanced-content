// BDD spec — semtext.dev landing page · source: web/site/index.html
//
// The page is itself a SemText document, so these assertions double as a
// smoke test that the vocabulary still works when a page composes it: the
// class tier (facts, views, procedure, properties, reveal), the Lit tier
// (sem-note) and extraction all run in one document here.
//
// Feature: the marketing page renders, its view-as toggle re-renders the
//          same deck three ways, and the vocabulary upgrades in place
//   Scenario: the page renders its hero and sections
//   Scenario: the view-as toggle switches the deck between list, flashcards and quiz
//   Scenario: extraction is invariant across every view
//   Scenario: the Lit tier upgrades the notes and the fallback tier wires the tabs

describe('semtext.dev landing page', () => {
  beforeEach(() => cy.visit('/site/index.html'));

  it('renders its hero and sections', () => {
    cy.get('h1').should('contain', 'reads three ways');
    cy.get('main.sem-enhanced-document').should('exist');
    cy.get('#why, #try, #tiers, #start, #surface, #scope').should('have.length', 6);
    cy.get('#try-deck .sem-fact').should('have.length', 4);
  });

  it('view-as toggle switches the deck without changing its content', () => {
    cy.get('#try-deck').should('have.attr', 'data-view-as', 'list');
    cy.get('#try-deck .sem-facts-chrome').should('not.exist');

    cy.get('.pg-toggle button[data-view="flashcards"]').click();
    cy.get('#try-deck').should('have.attr', 'data-view-as', 'flashcards');
    cy.get('#try-deck .sem-facts-chrome').should('exist');
    cy.get('#try-deck .sem-fact.sem-current').should('be.visible');

    cy.get('.pg-toggle button[data-view="quiz"]').click();
    cy.get('#try-deck').should('have.attr', 'data-view-as', 'quiz');
    cy.get('#try-deck .sem-quiz-options button').should('have.length.greaterThan', 1);

    // the four authored facts survive every switch
    cy.get('#try-deck .sem-fact').should('have.length', 4);
    cy.get('#try-deck #f-invariant .sem-statement')
      .should('contain', 'Extraction reads the authored document');
  });

  it('extraction is invariant across every view', () => {
    // the authored fallback text is what a scripts-off reader sees; it must
    // equal what the extractor produces live, in every view
    let listing;
    cy.get('#try-records').invoke('text').then((t) => { listing = t.trim(); });

    ['flashcards', 'quiz', 'list'].forEach((view) => {
      cy.get(`.pg-toggle button[data-view="${view}"]`).click();
      cy.get('#try-records').invoke('text').then((t) => {
        expect(t.trim(), `records in ${view} view`).to.equal(listing);
      });
    });
  });

  it('upgrades the vocabulary in place', () => {
    // Lit tier claims the notes
    cy.get('sem-note[data-sem-upgraded]').should('have.length', 3);
    cy.get('sem-note[data-variant="warning"]').should('have.attr', 'role', 'note');
    // fallback tier wires the tabs and the disclosures
    cy.get('#readers .sem-views-tabs button').should('have.length', 3);
    cy.get('.sem-reveal details').should('have.length', 3);
    // content stays in the light DOM
    // whitespace-normalised: the phrase is broken across source lines
    cy.get('sem-note[data-variant="info"] .sem-note-body')
      .invoke('text')
      .then((t) => expect(t.replace(/\s+/g, ' ')).to.contain('not a CMS'));
  });

  it('keeps flashcard flipping reachable from the keyboard', () => {
    cy.get('.pg-toggle button[data-view="flashcards"]').click();
    cy.get('#try-deck .sem-fact.sem-current')
      .should('have.attr', 'tabindex', '0')
      .focus()
      .type('{enter}')
      .should('have.class', 'sem-flipped');
  });
});
