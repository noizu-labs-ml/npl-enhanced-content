// BDD spec — sem-chronology / sem-event · source: spec/schema/sem-chronology.md
//
// Feature: an ordered, dated event list renders as a CSS-only timeline in
//          both authoring forms; the custom element upgrades where the
//          bundle runs and wires the Controls menu (sort/filter/search),
//          while the class form stays zero-JS
//   Scenario: authored roles, DOM order (both forms)
//   Scenario: class form stays zero-JS — no marker, no controls
//   Scenario: date label — <time> child wins, else attr(data-when)
//   Scenario: status glyph beside colour
//   Scenario: view-as="list" drops the rail, keeps every event
//   Scenario: element form upgrades — the Controls chrome is present
//   Scenario: JS-off — everything visible, no chrome, same labels

const cs = (el, pseudo) => el.ownerDocument.defaultView.getComputedStyle(el, pseudo);

function assertChronology(root) {
  it('authored roles and DOM order', () => {
    cy.get(root + '#history').should('have.attr', 'role', 'list');
    // the Controls chrome is a child too on the upgraded element form; the
    // authored events carry the role in both authoring forms
    cy.get(root + '#history > [role="listitem"]').should('have.length', 3).each(($e) => {
      cy.wrap($e).should('be.visible');
    });
    cy.get(root + '#history > [role="listitem"]').first().should('have.id', 'e-v01');
  });

  it('date label: <time> child when authored, attr(data-when) otherwise', () => {
    cy.get('#e-v01 time').should('be.visible').and('contain', '2 Mar 2026');
    cy.get('#e-v01').then(($e) => {
      expect(cs($e[0], '::before').content).not.to.match(/2026-03-02|data-when/);
    });
    cy.get('#e-themes time').should('not.exist');
    cy.get('#e-themes').then(($e) => {
      expect(cs($e[0], '::before').content).to.match(/2026-Q4|attr\(/);
    });
  });

  it('status is conveyed by a glyph, not colour alone', () => {
    cy.get('#e-v01').then(($e) => expect(cs($e[0], '::after').content).to.contain('✓'));
    cy.get('#e-waves').then(($e) => expect(cs($e[0], '::after').content).to.contain('→'));
    cy.get('#e-themes').then(($e) => expect(cs($e[0], '::after').content).to.match(/none|""/));
  });

  it('view-as="list" keeps every event visible', () => {
    cy.get(root + '#milestones > [role="listitem"]').should('have.length', 2).each(($e) => {
      cy.wrap($e).should('be.visible');
    });
    cy.get('#milestones').then(($c) => {
      // no rail in list mode
      expect(cs($c[0]).borderLeftWidth).to.equal('0px');
    });
    cy.get('#history').then(($c) => {
      expect(cs($c[0]).borderLeftWidth).not.to.equal('0px');
    });
  });
}

describe('sem-chronology', () => {
  describe('class form — /demo/reading.html', () => {
    beforeEach(() => cy.visit('/demo/reading.html'));
    it('stays zero-JS — no upgrade marker, no controls chrome', () => {
      cy.get('#history').should('not.have.attr', 'data-sem-upgraded');
      cy.get('#history .sem-chronology-chrome').should('not.exist');
    });
    assertChronology('.sem-chronology');
  });

  describe('element form — /demo/reading-lit.html (Lit upgrade)', () => {
    beforeEach(() => cy.visit('/demo/reading-lit.html'));
    it('defines the custom element — marker and Controls chrome present', () => {
      cy.window().then((win) => {
        expect(win.customElements.get('sem-chronology')).to.not.equal(undefined);
      });
      cy.get('sem-chronology#history').should('have.attr', 'data-sem-upgraded');
      cy.get('sem-chronology#history .sem-chronology-chrome').should('exist');
      cy.get('sem-chronology#history .sem-chronology-toggle').should(
        'have.attr', 'aria-haspopup', 'menu',
      );
    });
    assertChronology('sem-chronology');
  });

  describe('JS-off — /demo/reading.nojs.html', () => {
    beforeEach(() => cy.visit('/demo/reading.nojs.html'));
    it('ships no script and renders every event with its label', () => {
      cy.request('/demo/reading.nojs.html').its('body').should('not.match', /<script/i);
      cy.get('.sem-event').should('have.length', 5).each(($e) => cy.wrap($e).should('be.visible'));
      cy.get('#e-themes').then(($e) => {
        expect(cs($e[0], '::before').content).to.match(/2026-Q4|attr\(/);
      });
    });
  });
});
