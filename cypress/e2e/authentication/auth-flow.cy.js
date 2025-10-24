// cypress/e2e/authentication/auth-flow.cy.js
// isolation: true by default clears browser state. You need to login for each spec.
// here, you don't need to login in each spec.
describe('Authentication Flow', { testIsolation: false }, () => {
  
  before(() => {
    // Update site domain FIRST before any other operations
    // cy.updateSiteDomain();
    
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
  })

  it('should successfully login with registered user', () => {
    cy.log("Simulating signup for now. This should be setup as a ready data.");
    cy.loginAsRegistered();  
  })

  it('should show error for invalid login credentials', () => {
    cy.signOut();
    cy.loginAsInvalidCredentials();
  })

  it('should show error for duplicate email during registration', () => {
    cy.signUpDuplicateEmails();
  })

  it('should show error for mismatched passwords during registration', () => {
    cy.signUpMismatchedPasswords();
  })
})