// cypress/e2e/posteio/posteio-delete-regular-user.cy.js
describe('Poste.io Delete Regular User', () => {
  beforeEach(() => {
    // Ensure a clean state and log in before each test
    cy.clearAllCookies();
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
    cy.setupPosteio(); // This command ensures we are logged in and on the admin dashboard
  });

  it('should delete the regular user successfully', () => {
    // Delete the regular user (command handles existence check)
    cy.deletePosteioRegularUser();
  });
});