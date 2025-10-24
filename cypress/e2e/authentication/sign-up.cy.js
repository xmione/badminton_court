// cypress/e2e/authentication/sign-up.cy.js
describe('Authentication Flow', () => {
  before(() => {
    // Update site domain FIRST before any other operations
    cy.updateSiteDomain();
    
    // Then clean database
    cy.log('Cleaning database before authentication tests...');
    cy.resetDatabase();
    
    cy.log('Cleaning up test user...');
    cy.request({
      method: 'POST',
      url: '/api/test-cleanup-user/',
      body: { email: Cypress.env('REGULARUSER_EMAIL') },
      failOnStatusCode: false
    });
  });
  
  it('should successfully register a new user', () => {
    cy.signUp();
    cy.signOut();
  });
});