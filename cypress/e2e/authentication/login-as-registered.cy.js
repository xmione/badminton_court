// cypress/e2e/authentication/login-as-registered.cy.js
describe('Authentication Flow', () => {
    
  it('should successfully login with registered user', () => {
    cy.log("Simulating signup for now. This should be setup as a ready data.");
    cy.signUp(); // TODO: This should be setup as a ready data.
    cy.loginAsRegistered();  
  })
})