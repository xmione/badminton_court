// cypress/e2e/admin/delete-admin-group.cy.js

describe('Delete Administrators Group', () => {
    beforeEach(() => {
        // Ensure a clean state
        cy.clearAllCookies();
        cy.clearLocalStorage();
        cy.clearAllSessionStorage();
        
        // Create admin user via API
        cy.setupTestAdmin();
        
        // Actually log in via browser to establish session
        cy.visit('/admin/login/');
        cy.get('#id_username').type(Cypress.env('ADMIN_EMAIL'));
        cy.get('#id_password').type(Cypress.env('ADMIN_PASSWORD'));
        cy.get('input[type="submit"]').click();
        
        // Verify we're logged in
        cy.url().should('not.include', '/login');
    });

    it('should delete the Administrators group if it exists', () => {
        // First, ensure the group exists by creating it
        cy.createAdminGroup();
        
        // Verify the group exists
        cy.visit('/admin/auth/group/');
        cy.get('div[class*="results"]').should('contain', 'Administrators');
        
        // Now delete the group
        cy.deleteAdminGroup();
        
        // Verify the group no longer exists
        cy.visit('/admin/auth/group/');
        cy.get('div[class*="results"]').should('not.contain', 'Administrators');
    });
    
    it('should handle gracefully when the group does not exist', () => {
        // Ensure the group does not exist first
        cy.deleteAdminGroup();
        
        // Try to delete again - should handle gracefully
        cy.deleteAdminGroup();
        
        // Verify the group still does not exist
        cy.visit('/admin/auth/group/');
        cy.get('div[class*="results"]').should('not.contain', 'Administrators');
    });
});