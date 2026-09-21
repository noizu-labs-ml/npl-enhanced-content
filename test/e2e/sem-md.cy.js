// BDD spec — sem-md · source: spec/schema/sem-md.md
//
// Feature: a Markdown block rendered in the browser — fallback (Markdown
//          bundle) and Lit tiers behave identically; JS-off the raw
//          Markdown reads as preformatted text
//   Scenario: chrome is the first child — label, toggle (aria-pressed), copy, status
//   Scenario: a GFM table renders as thead/th[scope=col]/tbody with the alignment row honoured
//   Scenario: headings, emphasis, links (rel=noopener) and code spans render
//   Scenario: lists nest, block quotes, thematic breaks and fenced code render
//   Scenario: toggle shows the authored Markdown in a sem-code fence and back
//   Scenario: copy writes the normalised Markdown and announces "Copied"
//   Scenario: view-as="raw" is honoured as the initial mode
//   Scenario: default controls = toggle + copy
//   Scenario: script-injection Markdown renders as text — no script, no unsafe href
//   Scenario: upgraded tier — one chrome, same behaviour, handoff markers
//   Scenario: JS-off — no chrome, the raw Markdown visible as pre-wrapped text

const TABLE_SOURCE =
  '#### Lifetimes\n' +
  '\n' +
  'Every *session* mints a **short-lived** token; see [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) and `rotate()`.\n' +
  '\n' +
  '| Token   | Lifetime | Rotates |\n' +
  '| :------ | -------: | :-----: |\n' +
  '| access  | 15 min   | no      |\n' +
  '| refresh | 30 days  | yes     |';

const cs = (el, pseudo) => el.ownerDocument.defaultView.getComputedStyle(el, pseudo);

const visitWithClipboard = (url) =>
  cy.visit(url, {
    onBeforeLoad(win) {
      cy.stub(win.navigator.clipboard, 'writeText').as('write').resolves();
    }
  });

function assertMd(url, marker) {
  beforeEach(() => visitWithClipboard(url));

  it('carries the tier marker for this page', () => {
    cy.get('#m-table').should('have.attr', marker.present);
    cy.get('#m-table').should('not.have.attr', marker.absent);
  });

  it('renders exactly one chrome as the first child: label, toggle, copy, status', () => {
    cy.get('#m-table > .sem-md-chrome').should('have.length', 1);
    cy.get('#m-table > :first-child').should('have.class', 'sem-md-chrome');
    cy.get('#m-table .sem-md-label').should('have.text', 'Token lifetimes');
    cy.get('#m-table .sem-md-chrome button').then(($b) => {
      expect(Array.from($b, (b) => b.getAttribute('data-act'))).to.deep.equal(['toggle', 'copy']);
      $b.each((_, b) => expect(b.getAttribute('type')).to.equal('button'));
    });
    cy.get('#m-table [data-act="toggle"]').should('have.attr', 'aria-pressed', 'false');
    cy.get('#m-table [data-act="copy"]').should('have.attr', 'aria-label', 'Copy Markdown');
    cy.get('#m-table .sem-md-status').should('have.attr', 'role', 'status');
    cy.get('#m-table > .sem-md-body').should('have.length', 1);
    cy.get('#m-table > .sem-md-raw').should('have.length', 1);
    cy.get('#m-table').should('have.attr', 'data-view-as', 'rendered');
  });

  it('renders the GFM table with native semantics and the alignment row', () => {
    cy.get('#m-table .sem-md-body table').should('have.length', 1);
    cy.get('#m-table .sem-md-body thead th').then(($th) => {
      expect($th).to.have.length(3);
      $th.each((_, th) => expect(th.getAttribute('scope')).to.equal('col'));
      expect(Array.from($th, (th) => th.textContent)).to.deep.equal(['Token', 'Lifetime', 'Rotates']);
      expect($th[0].style.textAlign).to.equal('left');
      expect($th[1].style.textAlign).to.equal('right');
      expect($th[2].style.textAlign).to.equal('center');
    });
    cy.get('#m-table .sem-md-body tbody tr').should('have.length', 2);
    cy.get('#m-table .sem-md-body tbody tr').first().find('td').then(($td) => {
      expect(Array.from($td, (td) => td.textContent)).to.deep.equal(['access', '15 min', 'no']);
      expect($td[1].style.textAlign).to.equal('right');
    });
  });

  it('renders headings, emphasis, links and code spans', () => {
    cy.get('#m-table .sem-md-body h4').should('have.text', 'Lifetimes');
    cy.get('#m-table .sem-md-body p em').should('have.text', 'session');
    cy.get('#m-table .sem-md-body p strong').should('have.text', 'short-lived');
    cy.get('#m-table .sem-md-body p a')
      .should('have.text', 'RFC 6749')
      .should('have.attr', 'href', 'https://www.rfc-editor.org/rfc/rfc6749')
      .should('have.attr', 'rel', 'noopener');
    cy.get('#m-table .sem-md-body p code').should('have.text', 'rotate()');
  });

  it('renders nested lists, a block quote, a rule and fenced code', () => {
    cy.get('#m-raw .sem-md-body > ul > li').should('have.length', 2);
    cy.get('#m-raw .sem-md-body > ul > li').eq(1).find('ul > li').should('have.text', 'nested item');
    cy.get('#m-raw .sem-md-body > ol > li').should('have.length', 2);
    cy.get('#m-raw .sem-md-body blockquote p').should('have.text', 'A quoted line.');
    cy.get('#m-raw .sem-md-body hr').should('have.length', 1);
    cy.get('#m-raw .sem-md-body pre > code').should('have.class', 'language-sh')
      .and('have.text', 'curl -sS "$TOKEN_ENDPOINT"');
  });

  it('toggle shows the authored Markdown in a sem-code fence, and back', () => {
    cy.get('#m-table .sem-md-body').should('be.visible');
    cy.get('#m-table .sem-md-raw').should('not.be.visible');
    cy.get('#m-table [data-act="toggle"]').click();
    cy.get('#m-table').should('have.attr', 'data-view-as', 'raw');
    cy.get('#m-table [data-act="toggle"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('#m-table .sem-md-body').should('not.be.visible');
    cy.get('#m-table .sem-md-raw').should('be.visible');
    cy.get('#m-table .sem-md-raw .sem-code').should('have.attr', 'data-lang', 'markdown');
    cy.get('#m-table .sem-md-raw .sem-code > .sem-code-chrome').should('have.length', 1);
    cy.get('#m-table .sem-md-raw .sem-code-chrome button').should('have.length', 2);
    cy.get('#m-table .sem-md-raw code').then(($c) => expect($c[0].textContent).to.equal(TABLE_SOURCE));
    cy.get('#m-table [data-act="toggle"]').click();
    cy.get('#m-table').should('have.attr', 'data-view-as', 'rendered');
    cy.get('#m-table [data-act="toggle"]').should('have.attr', 'aria-pressed', 'false');
    cy.get('#m-table .sem-md-body').should('be.visible');
  });

  it('copy writes the normalised Markdown and announces "Copied"', () => {
    cy.get('#m-table > .sem-md-chrome [data-act="copy"]').click();
    cy.get('@write').should('have.been.calledWith', TABLE_SOURCE);
    cy.get('#m-table .sem-md-status').should('have.text', 'Copied');
  });

  it('view-as="raw" is honoured as the initial mode', () => {
    cy.get('#m-raw').should('have.attr', 'data-view-as', 'raw');
    cy.get('#m-raw [data-act="toggle"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('#m-raw .sem-md-raw').should('be.visible');
    cy.get('#m-raw .sem-md-body').should('not.be.visible');
  });

  it('default controls render toggle and copy; controls="copy" renders copy only', () => {
    cy.get('#m-raw .sem-md-chrome button').should('have.length', 2);
    cy.get('#m-inject .sem-md-chrome button').should('have.length', 1);
    cy.get('#m-inject .sem-md-chrome button').should('have.attr', 'data-act', 'copy');
    cy.get('#m-inject .sem-md-label').should('not.exist');
  });

  it('script-injection Markdown renders as text', () => {
    cy.get('#m-inject .sem-md-body script, #m-inject .sem-md-body img').should('not.exist');
    cy.get('#m-inject .sem-md-body a[href^="javascript"]').should('not.exist');
    cy.get('#m-inject .sem-md-body p').invoke('text').then((t) => {
      expect(t).to.contain('<script>alert(1)</script>');
      expect(t).to.contain('<img src=x onerror=alert(1)>');
      expect(t).to.contain('click');
    });
  });
}

describe('sem-md', () => {
  describe('fallback tier — /demo/reading.html', () => {
    assertMd('/demo/reading.html', { present: 'data-sem-fallback', absent: 'data-sem-upgraded' });
  });

  describe('upgraded tier — /demo/reading-lit.html', () => {
    it('registers the custom element', () => {
      cy.visit('/demo/reading-lit.html');
      cy.window().then((win) => expect(win.customElements.get('sem-md')).to.exist);
    });
    assertMd('/demo/reading-lit.html', { present: 'data-sem-upgraded', absent: 'data-sem-fallback' });
  });

  describe('JS-off', () => {
    ['/demo/reading.nojs.html', '/demo/reading-lit.nojs.html'].forEach((url) => {
      it(url + ' — no chrome, the raw Markdown visible as pre-wrapped text', () => {
        cy.visit(url);
        cy.get('.sem-md-chrome, .sem-md-body, .sem-md-raw').should('not.exist');
        cy.get('#m-table').should('be.visible');
        cy.get('#m-table').invoke('text').then((t) => {
          expect(t).to.contain('| :------ | -------: | :-----: |');
        });
        cy.get('#m-table').then(($m) => expect(cs($m[0]).whiteSpace).to.match(/pre-wrap|break-spaces/));
        cy.get('#m-table table').should('not.exist');
      });
    });
  });
});
