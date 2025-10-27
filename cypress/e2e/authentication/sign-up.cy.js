// cypress/e2e/authentication/sign-up.cy.js
describe('Authentication Flow', () => {
  before(() => {
    // Update site domain FIRST before any other operations
    cy.updateSiteDomain();
    
    // Clean up only the test user, not the entire database
    cy.log('Cleaning up test user before authentication tests...');
    cy.request({
      method: 'POST',
      url: '/api/test-cleanup-user/',
      body: { email: Cypress.env('REGULARUSER_EMAIL') },
      failOnStatusCode: false
    });
    
    // Ensure admin user and group exist (but don't reset database)
    cy.log('Ensuring admin setup exists...');
    cy.setupTestAdmin({ reset: false });
    cy.createAdminGroup();
    
    // Ensure admin user's email is verified
    cy.verifyUser(Cypress.env('ADMIN_EMAIL'))
  });
  
  it('should successfully register a new user', () => {
    cy.signUp();
    cy.signOut();
  });
});