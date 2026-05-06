// cypress/e2e/admin/delete-regular-users-group.cy.js

describe('Delete Regular Users Group', () => {
    beforeEach(() => {
        // Ensure a clean state and log in before each test
        cy.clearAllCookies();
        cy.clearLocalStorage();
        cy.clearAllSessionStorage();
        
        // Log in as an admin user using your existing command
        cy.setupTestAdmin();
        
        // Additional login to admin page if needed
        cy.loginToAdminPage();
    });

    it('should delete the Regular Users group if it exists', () => {
        // First, ensure the group exists by creating it
        cy.createRegularUsersGroup();
        
        // Verify the group exists
        cy.visit('/admin/auth/group/');
        cy.get('div[class*="results"]').should('contain', 'Regular Users');
        
        // Now delete the group
        cy.deleteRegularUsersGroup();
        
        // Verify the group no longer exists
        cy.visit('/admin/auth/group/');
        cy.get('div[class*="results"]').should('not.contain', 'Regular Users');
    });
    
    it('should handle gracefully when the group does not exist', () => {
        // Ensure the group does not exist first
        cy.deleteRegularUsersGroup();
        
        // Try to delete again - should handle gracefully
        cy.deleteRegularUsersGroup();
        
        // Verify the group still does not exist
        cy.visit('/admin/auth/group/');
        cy.get('div[class*="results"]').should('not.contain', 'Regular Users');
    });
});