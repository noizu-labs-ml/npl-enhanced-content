// BDD spec — sem-views / sem-view · source: syntax/schema/sem-views.md
//
// Feature: sem-views shows one named perspective at a time, switches by
//          click/keyboard/hash, degrades to stacked readable views JS-off
//   Scenario: first view active by default, others hidden
//   Scenario: tab click switches active view
//   Scenario: arrow keys move active view
//   Scenario: deep-link hash #id/name activates that view
//   Scenario: sem-navigate event fires with name and index

describe('sem-views', () => {
  beforeEach(() => cy.visit('/demo/index.html'));

  it('first view active by default, others hidden', () => {
    cy.get('#deploy .sem-view[data-name="Helm"]').should('be.visible');
    cy.get('#deploy .sem-view[data-name="ArgoCD"]').should('not.be.visible');
    cy.get('#deploy .sem-view[data-active]').should('have.length', 1);
  });

  it('tab click switches active view', () => {
    cy.get('#deploy .sem-views-tabs button').contains('ArgoCD').click();
    cy.get('#deploy .sem-view[data-name="ArgoCD"]').should('be.visible');
    cy.get('#deploy .sem-view[data-name="Helm"]').should('not.be.visible');
  });

  it('arrow keys move active view', () => {
    cy.get('#deploy .sem-views-tabs button').first().focus().type('{rightarrow}');
    cy.get('#deploy .sem-view[data-name="ArgoCD"]').should('be.visible');
  });

  it('deep-link hash activates that view', () => {
    cy.visit('/demo/index.html#deploy/argocd');
    cy.get('#deploy .sem-view[data-name="ArgoCD"]').should('be.visible');
    cy.get('#deploy .sem-view[data-name="Helm"]').should('not.be.visible');
  });

  it('sem-navigate event fires with name and index', () => {
    cy.window().then((win) => {
      const seen = [];
      win.document.getElementById('deploy')
        .addEventListener('sem-navigate', (e) => seen.push(e.detail));
      cy.get('#deploy .sem-views-tabs button').contains('ArgoCD').click();
      cy.wrap(seen).should((s) => {
        expect(s[0]).to.include({ name: 'ArgoCD', index: 1 });
      });
    });
  });
});
