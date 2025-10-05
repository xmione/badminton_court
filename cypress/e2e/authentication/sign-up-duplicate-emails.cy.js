// cypress/e2e/authentication/sign-up-duplicate-emails.cy.js
describe('Authentication Flow', () => {
  
  it('should show error for duplicate email during registration', () => {
    cy.signUpDuplicateEmails();
  })
})