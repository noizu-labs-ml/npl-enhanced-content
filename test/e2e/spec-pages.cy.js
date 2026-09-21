// BDD spec — the HTML spec pages under spec/ · source: spec/*.html, built to dist/spec/
//
// Feature: every HTML spec document is itself a SemText document — it
//          carries no inline CSS or JS, links the shipped theme + vocabulary
//          and loads the shipped bundles by <script src>; the vocabulary it
//          uses mounts on the enhanced tier; the scripts-stripped artifact
//          reads whole; and extraction is identical JS-off and JS-on
//   Scenario: the source carries no inline <style> and no inline <script> body
//   Scenario: every linked stylesheet and script resolves (200)
//   Scenario: the reader and every used element mount on the enhanced tier
//   Scenario: the .nojs artifact ships no script and hides nothing
//   Scenario: INVARIANT — records are identical JS-off and JS-on, before and after interaction
//   Scenario: the page renders at 1280 and 390 without horizontal overflow (screenshots)

// The build's own helper (loops to a fixed point; throws on an unclosed
// opener), imported rather than re-implemented so the two cannot drift.
import { stripComments } from '../../scripts/standalone-lib.mjs';

const clone = (v) => JSON.parse(JSON.stringify(v));
// Records come from the SHIPPED extractor (dist/semtext-extract.js), which
// the spec page loads itself. The .nojs artifact carries no script, so the
// same bundle is injected after load there — extraction never writes, and
// the vocabulary's tier markers are set by other bundles, not this one.
const loadExtractor = () =>
  cy.window().then((win) => {
    if (win.SemTextExtract) return;
    return new Cypress.Promise((ok, fail) => {
      const s = win.document.createElement('script');
      s.src = '/semtext-extract.js';
      s.onload = ok;
      s.onerror = () => fail(new Error('dist/semtext-extract.js did not load'));
      win.document.head.appendChild(s);
    });
  });
const records = () => loadExtractor().then(() => cy.window().then((win) => clone(win.SemTextExtract.extractRecords(win.document))));

// GitHub-style slug of a Markdown heading, so the .md outline anchors and the
// HTML ids can be compared mechanically.
const slug = (h) => h.toLowerCase().replace(/[`*]/g, '').replace(/[^\p{L}\p{N} -]/gu, '').trim().replace(/ /g, '-');

const PAGES = [
  {
    url: '/spec/conventions.html',
    nojs: '/spec/conventions.nojs.html',
    name: 'conventions',
    // element → the chrome / marker that proves the enhanced tier mounted it
    mounts: [
      ['#rd', '#rd > .sem-reader-chrome[role="region"]'],
      ['.sem-source', '.sem-source > .sem-source-chrome[role="group"]'],
      ['.sem-facts', '.sem-facts > .sem-facts-chrome'],
      ['.sem-details[data-view-as="quiz"]', '.sem-details .sem-occluded'],
      ['.sem-views', '.sem-views > .sem-views-tabs[role="tablist"]'],
      ['.sem-reveal', '.sem-reveal > details > summary'],
      ['.sem-progress', '.sem-progress > .sem-progress-track'],
      ['.sem-code', '.sem-code > .sem-code-chrome'],
      ['.sem-table[data-controls]', '.sem-table th .sem-table-sort'],
      ['.sem-references', '.sem-references .sem-references-backlinks'],
      ['.sem-md', '.sem-md[data-sem-fallback], .sem-md[data-sem-upgraded]'],
    ],
    // zero-JS elements: present and visible in every tier
    present: ['.sem-note', '.sem-audiences .sem-profile', '.sem-procedure .sem-step', '.sem-properties .sem-property', '.sem-chronology .sem-event'],
  },
];

// A <style> element or a style= attribute on a real tag both count.
const inlineStyles = (html) => {
  const h = stripComments(html);
  return (h.match(/<style[\s>]/gi) || []).length + (h.match(/<[a-z][^>]*\sstyle\s*=/gi) || []).length;
};
const inlineScripts = (html) =>
  (stripComments(html).match(/<script\b[^>]*>/gi) || []).filter((tag) => !/\bsrc\s*=/.test(tag) && !/application\/ld\+json/.test(tag)).length;
const assetUrls = (html, pageUrl) => {
  const base = new URL(pageUrl, 'http://x');
  const out = [];
  for (const m of html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)) out.push(m[1]);
  for (const m of html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)) out.push(m[1]);
  return out.map((u) => new URL(u, base).pathname);
};

PAGES.forEach((page) => {
  describe(`spec page — ${page.name}`, () => {
    it('carries no inline <style> and no inline <script> body', () => {
      cy.request(page.url).its('body').then((html) => {
        expect(inlineStyles(html), 'inline <style> elements').to.equal(0);
        expect(inlineScripts(html), 'inline <script> bodies').to.equal(0);
        expect(html).to.match(/<link[^>]+_vocabulary\.css/);
        expect(html).to.match(/<link[^>]+minimal-tech-light\.css/);
      });
    });

    it('inlineStyles() counts a style attribute as inline CSS', () => {
      expect(inlineStyles('<p style="color:red">x</p>')).to.equal(1);
      expect(inlineStyles('<!-- <style> --><p>x</p>')).to.equal(0);
    });

    it('carries an id for every heading of the normative Markdown', () => {
      cy.readFile('spec/conventions.md').then((md) => {
        const headings = [...md.matchAll(/^#{2,3} (.+)$/gm)].map((m) => m[1]).filter((h) => h !== 'Outline');
        expect(headings.length, 'markdown headings').to.be.greaterThan(12);
        cy.request(page.url).its('body').then((html) => {
          headings.forEach((h) => {
            expect(html, `heading "${h}"`).to.contain(`id="${slug(h)}"`);
          });
        });
      });
    });

    it('is shipped to dist/spec/ with rewritten asset paths and a themes copy', () => {
      cy.request(page.url).its('body').then((html) => {
        expect(html).not.to.contain('../dist/');
        expect(html).to.match(/<script src="\.\.\/semtext-fallback\.js">/);
        expect(html).to.match(/<link rel="stylesheet" href="\.\.\/themes\/_vocabulary\.css">/);
        // escaped examples are text, not tags: the rewrite must not touch them
        expect(html).to.contain('href="semtext/themes/minimal-tech-light.css"');
      });
      cy.request('/themes/_vocabulary.css').its('status').should('eq', 200);
      cy.request('/spec/spec.css').its('status').should('eq', 200);
    });

    it('every linked stylesheet and script resolves', () => {
      cy.request(page.url).its('body').then((html) => {
        const urls = assetUrls(html, page.url);
        expect(urls.length, 'linked assets').to.be.greaterThan(4);
        urls.forEach((u) => cy.request(u).its('status').should('eq', 200));
      });
    });

    it('is a SemText document whose reader and every used element mount on the enhanced tier', () => {
      cy.visit(page.url);
      cy.get('main.sem-enhanced-document').should('have.length', 1);
      cy.get('.sem-enhanced-document > :first-child').should('have.class', 'sem-reader');
      cy.get('html').should('have.attr', 'data-sem-fallback');
      page.mounts.forEach(([element, proof]) => {
        cy.get(element).should('have.length.greaterThan', 0);
        cy.get(proof).should('have.length.greaterThan', 0);
      });
      page.present.forEach((sel) => cy.get(sel).should('have.length.greaterThan', 0).and('be.visible'));
      // the outline is generated from the document headings and reaches each numbered section
      cy.get('#rd .sem-reader-toggle').click();
      cy.get('#rd nav[aria-label="Contents"] a[href="#0-model"]').should('exist');
      cy.get('#rd nav[aria-label="Contents"] a[href="#10-open-questions"]').should('exist');
      // depth 4: the element entries are in the outline
      cy.get('#rd nav[aria-label="Contents"] a[href="#e-source"]').should('exist');
    });

    it('sem-source shows the markup as written, for the example it wraps', () => {
      cy.visit(page.url);
      cy.get('#s-facts [data-act="source"]').click();
      cy.get('#s-facts > .sem-source-fence code').invoke('text').then((t) => {
        expect(t).to.contain('class="sem-facts" id="x-facts" data-view-as="flashcards"');
        expect(t).not.to.match(/sem-facts-chrome|sem-current|data-sem-fallback/);
      });
      cy.get('#s-facts [data-act="html"]').click();
      cy.get('#s-facts > .sem-source-fence').should('not.be.visible');
    });

    describe('the scripts-stripped artifact', () => {
      it('ships no script element at all', () => {
        cy.request(page.nojs).its('body').should('not.match', /<script/i);
      });

      it('hides nothing — no tier marker, every body, conclusion, distractor, view and highlight visible', () => {
        cy.visit(page.nojs);
        cy.get('[data-sem-fallback], [data-sem-upgraded]').should('not.exist');
        cy.get('.sem-reader-chrome, .sem-source-chrome, .sem-source-fence, .sem-facts-chrome, .sem-views-tabs, .sem-code-chrome, .sem-table-chrome, .sem-occluded').should('not.exist');
        ['.sem-note-body', '.sem-conclusion', '.sem-distractor', '.sem-view', '.sem-reveal', '.sem-highlight', '.sem-step', '.sem-property', '.sem-event', '.sem-code pre', '.sem-table table', '.sem-reference', '[data-audience]', '.sem-md']
          .forEach((sel) => cy.get(sel).should('have.length.greaterThan', 0).each(($el) => cy.wrap($el).should('be.visible')));
        // the source wrapper is transparent: its rendered children are in flow
        cy.get('.sem-source > :not(.sem-source-chrome, .sem-source-fence, script)').each(($el) => cy.wrap($el).should('be.visible'));
      });
    });

    it('INVARIANT — extraction is identical JS-off and JS-on, before and after interaction', () => {
      let off;
      cy.visit(page.nojs);
      records().then((r) => { off = r; expect(r.length, 'records').to.be.greaterThan(20); });
      cy.visit(page.url);
      records().then((r) => expect(r, 'enhanced page').to.deep.equal(off));
      // interact: flip an example to source, switch a tab, open a reveal, sort the table
      cy.get('#s-facts [data-act="source"]').click();
      cy.get('#x-deploy .sem-views-tabs button').last().click();
      cy.get('#x-reveal summary').click();
      cy.get('#x-table th .sem-table-sort').first().click();
      records().then((r) => expect(r, 'after interaction').to.deep.equal(off));
    });

    [[1280, 900, 'desktop'], [390, 844, 'phone']].forEach(([w, h, label]) => {
      it(`renders at ${w}px with no horizontal overflow (${label})`, () => {
        cy.viewport(w, h);
        cy.visit(page.url);
        cy.document().then((doc) => {
          expect(doc.documentElement.scrollWidth, 'scrollWidth').to.be.at.most(doc.documentElement.clientWidth + 1);
        });
        cy.get('#rd .sem-reader-chrome').should('be.visible');
        cy.screenshot(`spec-${page.name}-${w}`, { capture: 'fullPage' });
      });
    });
  });
});
