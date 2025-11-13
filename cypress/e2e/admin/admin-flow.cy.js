// cypress/e2e/admin/admin-flow.cy.js
// isolation: true by default clears browser state. You need to login for each spec.
describe('Admin Flow', () => {
  before(() => {
    cy.log('ADMIN SPEC: Starting admin-flow.cy.js before()');
    // The database is already migrated from the container startup
    // Now, reset and add admin-specific data.
    cy.resetDatabase(); // Resets tables *after* migrations
    cy.setupTestAdmin({ reset: true }); // Creates admin user
    cy.log('ADMIN SPEC: Finished admin-flow.cy.js before()');
  })

  beforeEach(() => {
    cy.log('ADMIN SPEC: Starting beforeEach()');

    // Ensure the admin user exists *before every test*
    // without resetting the whole database.
    cy.setupTestAdmin({ reset: false })

    // Ensure the Administrators group exists
    cy.createAdminGroup()

    // Ensure admin user's email is verified
    cy.verifyUser(Cypress.env('ADMIN_EMAIL'))

    cy.log('ADMIN SPEC: Finished beforeEach()');

  })

  it('should successfully login to admin panel', () => {
    cy.loginToAdminPage();
  })

  it('should successfully add user to Administrators group', () => {
    cy.loginToAdminPage();
    // Add the admin user to the Administrators group via UI
    cy.addUserToAdminGroup()
  })

  it('should show error for invalid credentials', () => {
    cy.loginToAdminPageWithInvalidCredentials();
  })
})