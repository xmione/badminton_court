// cypress/e2e/authentication/sign-up-mismatched-passwords.cy.js
describe('Authentication Flow', () => {
  
  it('should show error for mismatched passwords during registration', () => {
    cy.signUpDuplicateEmails();
  })
})