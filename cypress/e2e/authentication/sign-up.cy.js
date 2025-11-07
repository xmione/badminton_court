// cypress/e2e/authentication/sign-up.cy.js
describe('Authentication Flow', () => {
  before(() => {
    // Update site domain FIRST before any other operations
    cy.updateSiteDomain();
    
    // Clean up only the test user, not the entire database
    cy.log('Cleaning up test user before authentication tests...');
    cy.request({
      method: 'POST',
      url: '/api/test-cleanup-user/',
      body: { email: Cypress.env('REGULARUSER_EMAIL') },
      failOnStatusCode: false
    });
    
    // Ensure admin user and group exist (but don't reset database)
    cy.log('Ensuring admin setup exists...');
    cy.setupTestAdmin({ reset: false });
    cy.createAdminGroup();
    
    // Ensure Regular Users group exists
    cy.createRegularUsersGroup();
  });
  
  it('should successfully register a new user', () => {
    cy.signUp();
    cy.signOut();
    
    // Log in as admin to add the user to Regular Users group
    cy.visit('/admin/login/');
    cy.get('#id_username').type(Cypress.env('ADMIN_EMAIL'));
    cy.get('#id_password').type(Cypress.env('ADMIN_PASSWORD'));
    cy.get('input[type="submit"]').click();
    
    // Debug: Check if the user exists and their is_staff status
    cy.request({
      method: 'POST',
      url: '/api/debug-check-user/',
      body: { email: Cypress.env('REGULARUSER_EMAIL') },
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`User check response: ${JSON.stringify(response.body)}`);
      
      if (response.body.user_exists) {
        // Set is_staff flag to make user visible in admin
        if (!response.body.is_staff) {
          cy.request({
            method: 'POST',
            url: '/api/test-set-user-staff/',
            body: { 
              email: Cypress.env('REGULARUSER_EMAIL'),
              is_staff: true
            }
          }).then((staffResponse) => {
            cy.log(staffResponse.body.message);
          });
        }
        
        // Add the regular user to the Regular Users group via UI
        cy.addUserToRegularUsersGroup(Cypress.env('REGULARUSER_EMAIL'));
      } else {
        cy.log('User does not exist in database, skipping group assignment');
      }
    });
    
    // Log out as admin
    cy.signOut();
  });
});