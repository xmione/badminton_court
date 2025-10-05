// cypress/e2e/authentication/sign-up.cy.js
describe('Authentication Flow', () => {

  it('should successfully register a new user', () => {
    cy.signUp();
  })
})