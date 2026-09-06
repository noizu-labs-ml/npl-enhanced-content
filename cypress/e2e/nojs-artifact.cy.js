/**
 * The scripts-stripped artifact — genuine JS-off degradation.
 *
 * `window.__nplJsOff` only proves the fallback handler no-ops when asked; the
 * script is still in the page, so it can never show that the CSS alone leaves
 * a document readable. `scripts/build-standalone.mjs` emits
 * `dist/demo/<name>.nojs.html` with every <script> element removed, and this
 * spec asserts against that file.
 *
 * KNOWN GAP (ROADMAP D12): `.sem-distractor` and inactive `.sem-view` are
 * hidden by ungated `display:none` rules in themes/_vocabulary.css, so they
 * stay hidden here. That is asserted below as the current state rather than
 * papered over — when D12 is repaid these two expectations flip.
 */
describe('no-JS artifact (dist/demo/*.nojs.html)', () => {
  describe('class vocabulary — index.nojs.html', () => {
    beforeEach(() => cy.visit('/demo/index.nojs.html'));

    // Asserted against the raw bytes, not the loaded DOM: cypress injects its
    // own <script> into every page it drives, so a DOM count can never be 0.
    it('ships no script elements at all', () => {
      cy.request('/demo/index.nojs.html').its('body').should('not.match', /<script/i);
    });

    it('carries neither tier handoff marker', () => {
      cy.get('[data-sem-fallback]').should('not.exist');
      cy.get('[data-sem-upgraded]').should('not.exist');
    });

    it('leaves every fact readable — statement and conclusion both visible', () => {
      cy.get('.sem-fact').should('have.length.greaterThan', 0).each(($f) => {
        cy.wrap($f).should('be.visible');
        cy.wrap($f).find('.sem-statement').should('be.visible');
        cy.wrap($f).find('.sem-conclusion').should('be.visible');
      });
    });

    it('leaves the collapsed note body readable — no summary teaser to expand', () => {
      cy.get('.sem-note[collapsed] .sem-note-body').should('be.visible');
      cy.get('.sem-note-summary').should('not.exist');
    });

    it('leaves highlights inline rather than occluded', () => {
      cy.get('.sem-occluded').should('not.exist');
      cy.get('.sem-details[data-view-as="quiz"] .sem-highlight')
        .should('have.length.greaterThan', 0)
        .and('be.visible');
    });

    it('leaves reveal bodies open — no <details> wrapper is built', () => {
      cy.get('.sem-reveal details').should('not.exist');
      cy.get('.sem-reveal#r-storage').should('be.visible').and('contain.text', 'localStorage');
    });

    it('leaves procedure steps and properties fully rendered', () => {
      cy.get('.sem-step').should('have.length', 4).each(($s) => cy.wrap($s).should('be.visible'));
      cy.get('.sem-property').should('have.length', 5).each(($p) => cy.wrap($p).should('be.visible'));
    });

    it('D12 — distractors and inactive views are still hidden by ungated CSS', () => {
      cy.get('.sem-distractor').should('have.length', 4).each(($d) => {
        cy.wrap($d).should('not.be.visible');
      });
      cy.get('.sem-view[data-active]').should('be.visible');
      cy.get('.sem-view:not([data-active])').should('not.be.visible');
    });
  });

  describe('custom elements — standalone-lit.nojs.html', () => {
    beforeEach(() => cy.visit('/demo/standalone-lit.nojs.html'));

    it('ships no script elements and upgrades nothing', () => {
      cy.request('/demo/standalone-lit.nojs.html').its('body').should('not.match', /<script/i);
      cy.get('[data-sem-upgraded]').should('not.exist');
    });

    it('renders undefined custom elements as readable content', () => {
      cy.get('npl-note').should('have.length.greaterThan', 0).each(($n) => {
        cy.wrap($n).should('be.visible');
      });
      cy.get('npl-note[collapsed] .sem-note-body').should('be.visible');
      cy.get('npl-facts .sem-fact .sem-conclusion').each(($c) => cy.wrap($c).should('be.visible'));
      cy.get('npl-details .sem-highlight').should('be.visible');
      cy.get('npl-details .sem-occluded').should('not.exist');
    });
  });
});
