// cypress/e2e/authentication/sign-up.cy.js
describe('Authentication Flow', () => {

  // This hook runs once before all tests in this describe block
  before(() => {
    // Ensure we have a clean database before running sign-up tests
    cy.log('Cleaning database before authentication tests...');
    cy.resetDatabase();
  });
  
  it('should successfully register a new user', () => {
    cy.signUp();
  })
})