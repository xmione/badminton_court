// cypress/e2e/authentication/sign-up.cy.js
describe('Authentication Flow', () => {

  // This hook runs once before all tests in this describe block
  before(() => {
    // Update site domain to ensure correct domain in emails
    cy.log('Updating site domain configuration...');
    cy.updateSiteDomain();
    
    // Ensure we have a clean database before running sign-up tests
    cy.log('Cleaning database before authentication tests...');
    cy.resetDatabase();
    
    // Also clean up the specific test user we'll be using
    cy.log('Cleaning up test user...');
    cy.request({
      method: 'POST',
      url: '/api/test-cleanup-user/',
      body: { email: Cypress.env('REGULARUSER_EMAIL') },
      failOnStatusCode: false
    }).then((response) => {
      cy.log('Cleanup response:', response.body.message || 'User cleaned up');
    });
  });
  
  it('should successfully register a new user', () => {
    cy.signUp();
  });
   
});