// BDD spec — sem-source · source: spec/schema/sem-source.md
//
// Feature: a transparent wrapper whose reader can flip a section between
//          its rendered form and the literal authored markup — fallback
//          (core snapshot + reading bundle) and Lit tiers behave identically;
//          JS-off it is the rendered content and nothing else
//   Scenario: chrome is the first child — group, label, Rendered/Source with aria-pressed
//   Scenario: Source shows the authored markup (known substring) and no runtime chrome
//   Scenario: the fence is a sem-code with copy + wrap; copy writes the markup
//   Scenario: Rendered restores the content; the fence is built once
//   Scenario: an authored view-as="source" starts in source mode
//   Scenario: the snapshot script is inert text/plain
//   Scenario: upgraded tier — same behaviour, handoff markers
//   Scenario: JS-off — rendered content, no chrome, no fence, nothing hidden

const visitWithClipboard = (url) =>
  cy.visit(url, {
    onBeforeLoad(win) {
      cy.stub(win.navigator.clipboard, 'writeText').as('write').resolves();
    }
  });

function assertSource(url, id, marker, authored) {
  beforeEach(() => visitWithClipboard(url));

  it('carries the tier marker for this page', () => {
    cy.get(id).should('have.attr', marker.present);
    cy.get(id).should('not.have.attr', marker.absent);
  });

  it('renders one chrome as the first child: a labelled group with Rendered | Source', () => {
    cy.get(`${id} > .sem-source-chrome`).should('have.length', 1);
    cy.get(`${id} > :first-child`).should('have.class', 'sem-source-chrome');
    cy.get(`${id} > .sem-source-chrome`).should('have.attr', 'role', 'group');
    cy.get(`${id} > .sem-source-chrome`).should('have.attr', 'aria-label', 'View as');
    cy.get(`${id} > .sem-source-chrome button`).then(($b) => {
      expect(Array.from($b, (b) => b.getAttribute('data-act'))).to.deep.equal(['html', 'source']);
      expect(Array.from($b, (b) => b.textContent)).to.deep.equal(['Rendered', 'Source']);
      $b.each((_, b) => expect(b.getAttribute('type')).to.equal('button'));
    });
    cy.get(`${id} [data-act="html"]`).should('have.attr', 'aria-pressed', 'true');
    cy.get(`${id} [data-act="source"]`).should('have.attr', 'aria-pressed', 'false');
    cy.get(`${id} .sem-source-fence`).should('not.exist');
  });

  it('Source shows the authored markup and hides the rendered children', () => {
    cy.get(`${id} [data-act="source"]`).click();
    cy.get(id).should('have.attr', 'data-view-as', 'source');
    cy.get(`${id} [data-act="source"]`).should('have.attr', 'aria-pressed', 'true');
    cy.get(`${id} [data-act="html"]`).should('have.attr', 'aria-pressed', 'false');
    cy.get(`${id} > .sem-source-fence`).should('be.visible');
    cy.get(`${id} > .sem-source-fence > .sem-code`)
      .should('have.attr', 'data-lang', 'html')
      .and('have.attr', 'data-sem-fallback');
    cy.get(`${id} > .sem-source-fence code`).invoke('text').then((t) => {
      expect(t).to.contain(authored);
      // the markup is the document as written: no runtime chrome, no state
      expect(t).not.to.match(/sem-(facts|note|code|source)-chrome|sem-current|sem-source-raw|data-sem-(fallback|upgraded)/);
      // common indentation removed: the first line starts at column 0
      expect(t).to.match(/^\S/);
    });
    // every rendered child other than the chrome and fence is hidden
    cy.get(`${id} > :not(.sem-source-chrome, .sem-source-fence, script)`).each(($c) => {
      cy.wrap($c).should('not.be.visible');
    });
  });

  it('the fence is a sem-code with copy and wrap; copy writes the markup', () => {
    cy.get(`${id} [data-act="source"]`).click();
    cy.get(`${id} .sem-source-fence .sem-code-chrome button`).then(($b) => {
      expect(Array.from($b, (b) => b.getAttribute('data-act'))).to.deep.equal(['copy', 'wrap']);
    });
    cy.get(`${id} .sem-source-fence [data-act="copy"]`).click();
    cy.get('@write').should('have.been.calledOnce');
    cy.get('@write').then((w) => expect(w.firstCall.args[0]).to.contain(authored));
    cy.get(`${id} .sem-source-fence .sem-code-status`).should('have.text', 'Copied');
  });

  it('Rendered restores the content; the fence is built once and reused', () => {
    cy.get(`${id} [data-act="source"]`).click();
    cy.get(`${id} > .sem-source-fence`).should('be.visible');
    cy.get(`${id} [data-act="html"]`).click();
    cy.get(id).should('have.attr', 'data-view-as', 'html');
    cy.get(`${id} > .sem-source-fence`).should('not.be.visible');
    cy.get(`${id} > :not(.sem-source-chrome, .sem-source-fence, script)`).first().should('be.visible');
    cy.get(`${id} [data-act="source"]`).click();
    cy.get(`${id} > .sem-source-fence`).should('have.length', 1);
    cy.get(`${id} .sem-source-fence .sem-code`).should('have.length', 1);
  });

  it('the snapshot is an inert text/plain script, present once', () => {
    cy.get(`${id} > script.sem-source-raw`).should('have.length', 1)
      .and('have.attr', 'type', 'text/plain');
    cy.get(`${id} > script.sem-source-raw`).invoke('text').should('contain', authored);
  });
}

describe('sem-source', () => {
  describe('fallback tier — /demo/index.html (class form)', () => {
    assertSource('/demo/index.html', '#s-flash',
      { present: 'data-sem-fallback', absent: 'data-sem-upgraded' },
      '<div class="sem-facts" data-view-as="flashcards">');

    it('an authored data-view-as="source" starts in source mode', () => {
      cy.visit('/demo/index.html');
      cy.get('#s-initial').should('have.attr', 'data-view-as', 'source');
      cy.get('#s-initial > .sem-source-fence').should('be.visible');
      cy.get('#s-initial [data-act="source"]').should('have.attr', 'aria-pressed', 'true');
      cy.get('#s-initial .sem-source-fence code').invoke('text').should('contain', '<p>Plain prose');
      cy.get('#s-initial > p').should('not.be.visible');
      cy.get('#s-initial [data-act="html"]').click();
      cy.get('#s-initial > p').should('be.visible');
    });

    it('a rendered child keeps its own behaviour before and after a round trip', () => {
      cy.visit('/demo/index.html');
      cy.get('#s-flash .sem-fact.sem-current').should('be.visible');
      cy.get('#s-flash [data-act="source"]').click();
      cy.get('#s-flash [data-act="html"]').click();
      cy.get('#s-flash .sem-facts-chrome').should('be.visible');
      cy.get('#s-flash .sem-fact.sem-current').should('be.visible');
    });
  });

  describe('upgraded tier — /demo/reading-lit.html (element form)', () => {
    it('registers the custom element', () => {
      cy.visit('/demo/reading-lit.html');
      cy.window().then((win) => expect(win.customElements.get('sem-source')).to.exist);
    });
    assertSource('/demo/reading-lit.html', '#s-lit',
      { present: 'data-sem-upgraded', absent: 'data-sem-fallback' },
      '<sem-code');
  });

  describe('JS-off', () => {
    it('/demo/index.nojs.html — rendered content, no chrome, no fence, nothing hidden', () => {
      cy.visit('/demo/index.nojs.html');
      cy.get('.sem-source-chrome, .sem-source-fence, .sem-source-raw').should('not.exist');
      cy.get('#s-flash .sem-fact').each(($f) => cy.wrap($f).should('be.visible'));
      // an authored source mode still reads as HTML when nothing can build a fence
      cy.get('#s-initial').should('have.attr', 'data-view-as', 'source');
      cy.get('#s-initial > p').should('be.visible');
    });

    it('/demo/reading-lit.nojs.html — the same for the element form', () => {
      cy.visit('/demo/reading-lit.nojs.html');
      cy.get('.sem-source-chrome, .sem-source-fence, .sem-source-raw').should('not.exist');
      cy.get('#s-lit > :not(script)').each(($c) => cy.wrap($c).should('be.visible'));
    });
  });
});
