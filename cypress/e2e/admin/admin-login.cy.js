// cypress/e2e/admin/admin-login.cy.js
// isolation: true by default clears browser state. You need to login for each spec.
describe('Admin Login', () => {
  before(() => {
    cy.log('ADMIN SPEC: Starting admin-login.cy.js before()');
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
    cy.adminLogin({admin:'admin', password:'password', setup:false});

    // If it's an invalid login, these assertions might fail.
    // You might want to make the successful login verification conditional,
    // or create a separate command for invalid login.
    // For now, let's assume this command is for *successful* login flow.
    cy.url().should('include', '/admin/');
    cy.contains('Site administration').should('be.visible');
    cy.contains('Welcome, admin').should('be.visible');
  })

  it('should show error for invalid credentials', () => {
    cy.adminLogin({admin:'invalid_user', password:'wrong_password', setup:false});
    
    // Get the error note element and log its content
    cy.get(".errornote", {timeout: 5000})
      .should("be.visible")
      .then(($errorNote) => {
        // Get the actual text content
        const errorText = $errorNote.text();
        cy.log(`Actual error text: "${errorText}"`);
        
        // Assert the content matches the actual Django error message
        expect(errorText).to.include('Please enter the correct username and password');
        expect(errorText).to.include('staff account');
      });
  })
})