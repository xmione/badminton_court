// cypress/e2e/admin/create-admin-group.cy.js

describe('Create/Update Regular Users Group', () => {
    before(() => {
        // Reset database and setup admin user
        cy.resetDatabase();
        cy.setupTestAdmin({ reset: true });
    });

    beforeEach(() => {
        // Ensure admin user exists without resetting database
        cy.setupTestAdmin({ reset: false });
        
        // Log in via browser to establish session
        cy.loginToAdminPage();
        
        // Verify we're logged in
        cy.url().should('not.include', '/login');
    });

    it('should create or update a Regular Users group with all permissions', () => {
        // Use the API command to create or update the Regular Users group
        cy.createRegularUsersGroup();

        // Verify the group exists in the list via UI
        cy.visit('/admin/auth/group/');
        cy.get('body').should('contain', 'Groups');
        cy.get('div[class*="results"]').should('contain', 'Regular Users');
    });
});