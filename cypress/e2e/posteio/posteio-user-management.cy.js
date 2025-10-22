describe('Poste.io User Management', () => {
  beforeEach(() => {
    // Ensure a clean state and log in before each test
    cy.clearAllCookies();
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
    cy.setupPosteio(); // This command ensures we are logged in and on the admin dashboard
  });

  it('should add a new regular user successfully', () => {
    // Use the new command to add the user defined in your .env file
    cy.addRegularUser();

    // You can add more assertions here if needed, e.g., checking for a success message.
  });
});