// cypress/e2e/admin/admin-login.cy.js
// isolation: true by default clears browser state. You need to login for each spec.
describe('Admin Login', () => {
  before(() => {
    cy.log('ADMIN SPEC: Starting admin-login.cy.js before()');
    
    // The database is already migrated from the container startup
    // Now, reset and add admin-specific data.
    cy.resetDatabase(); // Resets tables *after* migrations
    cy.setupTestAdmin({ reset: true }); // Creates admin user
    cy.log('ADMIN SPEC: Finished admin-login.cy.js before()');
  })

  beforeEach(() => {
    cy.log('ADMIN SPEC: Starting beforeEach()');
    
    // Ensure the admin user exists *before every test*
    // without resetting the whole database.
    cy.setupTestAdmin({ reset: false })
    
    // Ensure the Administrators group exists
    cy.createAdminGroup()
        
  })

  it('should successfully login to admin panel', () => {
    cy.loginToAdminPage();

    // Add the admin user to the Administrators group via UI
    cy.addUserToAdminGroup()
  })

  it('should show error for invalid credentials', () => {
    cy.loginToAdminPageWithInvalidCredentials();
  })
})