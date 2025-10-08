// cypress/e2e/authentication/auth-flow.cy.js
describe('Authentication Flow', () => {
  
  it('should successfully register a new user', () => {
    cy.signUp();
  })

  it('should successfully login with registered user', () => {
    cy.loginAsRegistered();
  })

  it('should show error for invalid login credentials', () => {
    cy.loginAsInvalidCredentials();
  })

  it('should show error for duplicate email during registration', () => {
    cy.signUpDuplicateEmails();
  })

  it('should show error for mismatched passwords during registration', () => {
    cy.signUpMismatchedPasswords();
  })
})