// BDD spec — npl-views / npl-view · source: syntax/schema/npl-views.md
//
// Feature: npl-views shows one named perspective at a time, switches by
//          click/keyboard/hash, degrades to stacked readable views JS-off
//   Scenario: first view active by default, others hidden
//   Scenario: tab click switches active view
//   Scenario: arrow keys move active view
//   Scenario: deep-link hash #id/name activates that view
//   Scenario: npl-navigate event fires with name and index

describe('npl-views', () => {
  beforeEach(() => cy.visit('/demo/index.html'));

  it('first view active by default, others hidden', () => {
    cy.get('#deploy .npl-view[data-name="Helm"]').should('be.visible');
    cy.get('#deploy .npl-view[data-name="ArgoCD"]').should('not.be.visible');
    cy.get('#deploy .npl-view[data-active]').should('have.length', 1);
  });

  it('tab click switches active view', () => {
    cy.get('#deploy .npl-views-tabs button').contains('ArgoCD').click();
    cy.get('#deploy .npl-view[data-name="ArgoCD"]').should('be.visible');
    cy.get('#deploy .npl-view[data-name="Helm"]').should('not.be.visible');
  });

  it('arrow keys move active view', () => {
    cy.get('#deploy .npl-views-tabs button').first().focus().type('{rightarrow}');
    cy.get('#deploy .npl-view[data-name="ArgoCD"]').should('be.visible');
  });

  it('deep-link hash activates that view', () => {
    cy.visit('/demo/index.html#deploy/argocd');
    cy.get('#deploy .npl-view[data-name="ArgoCD"]').should('be.visible');
    cy.get('#deploy .npl-view[data-name="Helm"]').should('not.be.visible');
  });

  it('npl-navigate event fires with name and index', () => {
    cy.window().then((win) => {
      const seen = [];
      win.document.getElementById('deploy')
        .addEventListener('npl-navigate', (e) => seen.push(e.detail));
      cy.get('#deploy .npl-views-tabs button').contains('ArgoCD').click();
      cy.wrap(seen).should((s) => {
        expect(s[0]).to.include({ name: 'ArgoCD', index: 1 });
      });
    });
  });
});
