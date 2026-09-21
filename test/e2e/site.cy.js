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
//   Scenario: the Reading section mounts every R/W0 + R/W1 example live
//   Scenario: glossary previews, code chrome, reference backlinks behave
//   Scenario: audience picker links filter with native hidden
//   Scenario: a deep link opens the collapsed question it targets
//   Scenario: JS-off the Reading section hides nothing and grows no chrome

describe('semtext.dev landing page', () => {
  beforeEach(() => cy.visit('/site/index.html'));

  it('renders its hero and sections', () => {
    cy.get('h1').should('contain', 'reads three ways');
    cy.get('main.sem-enhanced-document').should('exist');
    cy.get('#why, #try, #tiers, #reading, #start, #surface, #scope').should('have.length', 7);
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

  describe('Reading section (R/W0 + R/W1 live examples)', () => {
    it('mounts every example with its authored roles and tier markers', () => {
      cy.get('#rd-margin').should('have.attr', 'data-view-as', 'margin').and('be.visible');
      cy.get('#rd-glossary').should('have.attr', 'data-sem-fallback');
      cy.get('#rd-history').should('have.attr', 'role', 'list');
      cy.get('#rd-history .sem-event').should('have.length', 4);
      cy.get('#rd-code').should('have.attr', 'data-sem-fallback');
      cy.get('#rd-refs').should('have.attr', 'data-sem-fallback');
      cy.get('#rd-audiences .sem-profile').should('have.length', 2);
    });

    it('glossary term previews, code chrome and reference backlinks behave', () => {
      cy.get('#rd-term-marker').should('have.class', 'sem-properties-ref').focus();
      cy.get('.sem-popover').should('be.visible').and('contain.text', 'tier marker');
      cy.get('body').type('{esc}');
      cy.get('.sem-popover').should('not.be.visible');

      cy.get('#rd-code > .sem-code-chrome').should('have.length', 1);
      cy.get('#rd-code .sem-code-filename').should('have.text', 'doc.html');
      cy.get('#rd-code code mark.sem-code-line').should('have.length', 2);
      cy.get('#rd-code [data-act="wrap"]').click();
      cy.get('#rd-code').should('have.attr', 'data-wrap');

      cy.get('#rd-cite-1').should('have.class', 'sem-references-ref');
      cy.get('#rd-r-extraction .sem-references-backlinks a')
        .should('have.length', 1)
        .and('have.attr', 'href', '#rd-cite-1');
      cy.get('#rd-r-extraction .sem-references-link').should('exist');
      cy.get('#rd-cite-2').focus();
      cy.get('.sem-popover').should('be.visible').and('contain.text', 'Print appends');
    });

    it('audience picker links filter with native hidden and never remove content', () => {
      cy.get('#rd-n-operator').should('not.be.visible');
      cy.get('#rd-n-public').should('be.visible');
      cy.get('.pg-picker a[href="#sem-audience=operator"]').click();
      cy.get('#rd-n-operator').should('be.visible');
      cy.get('#rd-n-reader').should('be.visible');
      cy.get('#rd-n-public').should('not.be.visible');
      cy.get('.pg-picker a[href="#sem-audience=reader"]').click();
      cy.get('#rd-n-operator').should('not.be.visible');
      cy.get('#rd-n-public').should('be.visible');
      cy.get('#rd-n-operator').should('exist');
    });

    it('a deep link opens the collapsed question it targets', () => {
      cy.get('#q-markdown details').should('not.have.attr', 'open');
      cy.get('#rd-deep-link').click();
      cy.get('#q-markdown details').should('have.attr', 'open');
      cy.get('#q-markdown').should('have.class', 'sem-target');
    });

    it('JS-off: the Reading section hides nothing and grows no chrome', () => {
      cy.visit('/site/index.html', { onBeforeLoad(win) { win.__semJsOff = true; } });
      cy.get('.sem-code-chrome, .sem-references-backlinks, .sem-popover, .sem-properties-ref')
        .should('not.exist');
      cy.get('#rd-n-operator, #rd-n-reader, #rd-n-public').each(($n) => cy.wrap($n).should('be.visible'));
      cy.get('#rd-code pre').should('be.visible');
      cy.get('#rd-history .sem-event').each(($e) => cy.wrap($e).should('be.visible'));
      cy.get('#rd-glossary .sem-property').should('have.length', 3);
    });
  });
});
