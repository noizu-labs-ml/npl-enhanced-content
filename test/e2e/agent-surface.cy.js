// BDD spec — agent surface: llms.txt + the published extraction contract
//   source: scripts/build-standalone.mjs (llms.txt generation), spec/conventions.md §8
//
// Feature: an agent arriving at the site can discover the spec, the
//          extraction contract and the element schemas from one file, and
//          every link that file lists resolves to a served artifact
//   Scenario: llms.txt is served from the build output with the required sections
//   Scenario: every link in llms.txt resolves, relative to the file itself
//   Scenario: conventions.html carries the extraction-invariant section by heading
//   Scenario: the served normative Markdown states the invariant formula

const LLMS_URL = '/site/llms.txt';
// The invariant formula is the contract's fingerprint: stated in llms.txt,
// in conventions §8 and in the extraction schema, and nowhere altered.
const INVARIANT = 'E(D) = E(R(D)) = E(I(R(D)))';

const parseLinks = (text) => [...text.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);

describe('agent surface', () => {
  it('llms.txt is served from the build output with the required sections', () => {
    cy.request(LLMS_URL).its('body').then((body) => {
      expect(body, 'H1 names the format').to.match(/^# SemText/);
      expect(body, 'what-this-is paragraph').to.contain('custom-element vocabulary');
      expect(body, 'the invariant, stated in the summary').to.contain(INVARIANT);
      expect(body, 'docs section').to.contain('## Docs');
      expect(body, 'spec link carries the §8 anchor').to.contain('conventions.html#8-machine-readability-contract');
      expect(body, 'element schemas section').to.contain('## Element schemas');
      expect(body, 'demo section').to.contain('## Demo');
      expect(body, 'nojs artifact listed').to.contain('index.nojs.html');
    });
  });

  it('every link in llms.txt resolves, relative to the file itself', () => {
    cy.request(LLMS_URL).its('body').then((body) => {
      const links = parseLinks(body);
      expect(links.length, 'llms.txt lists links').to.be.greaterThan(10);
      const base = Cypress.config('baseUrl') + LLMS_URL;
      links.forEach((href) => {
        const path = new URL(href, base).pathname;
        cy.request({ url: path, failOnStatusCode: true }).its('status').should('eq', 200);
      });
    });
  });

  it('conventions.html carries the extraction-invariant section by heading', () => {
    // Heading-based, never substring: a fallback page could carry any string;
    // only the real document carries the headings.
    cy.visit('/spec/conventions.html');
    cy.get('h2[id="8-machine-readability-contract"]').should('contain', 'Machine-readability contract');
    cy.get('h3[id="the-extraction-invariant-normative"]').should('contain', 'The extraction invariant');
    cy.get('h3[id="what-a-consumer-may-rely-on"]').should('contain', 'What a consumer may rely on');
    cy.get('h3[id="best-effort-only-not-guaranteed"]').should('contain', 'Best-effort only');
    // and the statement itself lives in the section, not loose on the page
    cy.get('#the-extraction-invariant-normative').nextAll().invoke('text')
      .then((t) => expect(t).to.contain(INVARIANT));
  });

  it('the served normative Markdown states the invariant formula', () => {
    cy.request('/spec/conventions.md').its('body').should('contain', INVARIANT);
    cy.request('/spec/extraction.md').its('body').should('contain', INVARIANT);
  });
});
