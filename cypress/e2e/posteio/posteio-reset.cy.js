// cypress/e2e/posteio/posteio-reset.cy.js

describe('Poste.io Reset Tests', { testIsolation: false }, () => {
  
  it('should reset the Poste.io database successfully', () => {
    cy.resetPosteioDb();
  });
});