// cypress/e2e/posteio/reset-posteio.cy.js
// isolation: true by default clears browser state. You need to login for each spec.
describe('Poste.io Server Database Reset', () => {
  beforeEach(() => {
    // Ensure a clean state by clearing all cookies, session, and local storage
    cy.clearAllCookies();
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
  });

  it('should reset the Poste.io database successfully', () => {
    cy.log('Resetting Poste.io database...');
    cy.resetPosteioDb();

    // The validation is already included in the resetPosteioDb command
    // It will log the number of deleted/skipped mailboxes

    // Additional validation: Verify we can still access Poste.io
    cy.request({
      method: 'GET',
      url: Cypress.env('POSTE_API_HOST'),
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 302, 301]);
      cy.log('✓ Poste.io server is still accessible after reset');
    });
  });

});