// cypress/e2e/admin/create-admin-group.cy.js

describe('Create/Update Administrators Group', () => {
    before(() => {
        // Reset database and setup admin user
        cy.resetDatabase();
        cy.setupTestAdmin({ reset: true });
    });

    beforeEach(() => {
        // Ensure admin user exists without resetting database
        cy.setupTestAdmin({ reset: false });
        
        // Log in via browser to establish session
        cy.visit('/admin/login/');
        cy.get('#id_username').type(Cypress.env('ADMIN_EMAIL'));
        cy.get('#id_password').type(Cypress.env('ADMIN_PASSWORD'));
        cy.get('input[type="submit"]').click();
        
        // Verify we're logged in
        cy.url().should('not.include', '/login');
    });

    it('should create or update an Administrators group with all permissions', () => {
        // Use the API command to create or update the Administrators group
        cy.createAdminGroup();

        // Verify the group exists in the list via UI
        cy.visit('/admin/auth/group/');
        cy.get('body').should('contain', 'Groups');
        cy.get('div[class*="results"]').should('contain', 'Administrators');
    });
});