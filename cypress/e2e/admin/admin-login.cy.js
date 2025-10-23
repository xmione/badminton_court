// cypress/e2e/admin/admin-login.cy.js
// isolation: true by default clears browser state. You need to login for each spec.
describe('Admin Login', () => {
  before(() => {
    cy.log('ADMIN SPEC: Starting admin-login.cy.js before()');
    
    // Run migrations inside the Docker container
    cy.log('Running database migrations...');
    cy.exec('docker exec web-dev python manage.py migrate', { timeout: 60000 })
      .then((result) => {
        if (result.code !== 0) {
          cy.log(`Migration failed: ${result.stderr}`);
          throw new Error('Migration failed. Check the logs for details.');
        } else {
          cy.log('Migrations completed successfully');
        }
      });
    
    // The database is already migrated from global before().
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
  })

  it('should successfully login to admin panel', () => {
    cy.loginToAdminPage();
  })

  it('should show error for invalid credentials', () => {
    cy.loginToAdminPageWithInvalidCredentials();
  })
})