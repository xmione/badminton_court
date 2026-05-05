// cypress/e2e/posteio/posteio-reset.cy.js

describe('Poste.io Reset Tests', { testIsolation: false }, () => {
  
  it('should reset the Poste.io database successfully', () => {
    cy.resetPosteioDb();
  });

  it('should ensure setup is complete and log in successfully', () => {
    // Ensure a clean state by clearing all cookies, session, and local storage
    cy.clearAllCookies();
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
    // This single command now handles both setup and login, no matter the state.
    cy.setupPosteio();

    // If we reach this point, we are successfully logged in.
    cy.url().should('include', '/admin/');
    cy.get('h1').should('contain', 'Mailserver dashboard');
  });

    
  it('should add a new regular user successfully', () => {

    // Ensure a clean state and log in before each test
    cy.clearAllCookies();
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
    cy.setupPosteio(); // This command ensures we are logged in and on the admin dashboard

    // Use the new command to add the user defined in your .env file
    cy.addRegularUser();

    // You can add more assertions here if needed, e.g., checking for a success message.
  });
});