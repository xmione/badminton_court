// cypress/e2e/authentication/login-as-registered.cy.js
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

  it('should successfully login with registered user', () => {
    cy.log("Simulating signup for now. This should be setup as a ready data.");
    cy.signUp(); 
    cy.signOut();
    cy.loginAsRegistered();  
  })
})