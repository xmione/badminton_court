// cypress/e2e/posteio/posteio-setup.cy.js
// isolation: true by default clears browser state. You need to login for each spec.
describe('Poste.io Server Setup and Login', () => {
  beforeEach(() => {
    // Ensure a clean state by clearing all cookies, session, and local storage
    cy.clearAllCookies();
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
  });

  it('should ensure setup is complete and log in successfully', () => {
    // This single command now handles both setup and login, no matter the state.
    cy.setupPosteio();

    // If we reach this point, we are successfully logged in.
    cy.url().should('include', '/admin/');
    cy.get('h1').should('contain', 'Mailserver dashboard');
  });
});