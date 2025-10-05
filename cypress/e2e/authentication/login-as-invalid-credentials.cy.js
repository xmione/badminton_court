// cypress/e2e/authentication/login-as-invalid-credentials.cy.js
describe('Authentication Flow', () => {
    
  it('should show error for invalid login credentials', () => {
    cy.loginAsInvalidCredentials();
  })
})