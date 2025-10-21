// cypress/support/commands/loginToAdminPage.cy.js

export const loginToAdminPage = () => {
    Cypress.Commands.add('loginToAdminPage', (options = {}) => {
        // Get environment variables - these must be set
        const adminEmail = Cypress.env('ADMIN_EMAIL');
        const adminPassword = Cypress.env('ADMIN_PASSWORD');
        
        // Verify environment variables are set
        if (!adminEmail) {
            throw new Error('ADMIN_EMAIL environment variable is not set');
        }
        if (!adminPassword) {
            throw new Error('ADMIN_PASSWORD environment variable is not set');
        }
        
        cy.showWaitMessage('This Test will log user as Admin in the Admin Page...', 10000);
        cy.adminLogin({ 
            username: adminEmail, 
            password: adminPassword, 
            setup: false 
        });

        // If it's an invalid login, these assertions might fail.
        // You might want to make the successful login verification conditional,
        // or create a separate command for invalid login.
        // For now, let's assume this command is for *successful* login flow.
        cy.url().should('include', '/admin/');
        cy.contains('Aeropace Badminton Court').should('be.visible');
        cy.contains('Welcome, admin').should('be.visible');
        cy.showWaitMessage('Admins with valid credentials can view and manage the site...', 10000);
    })
};

loginToAdminPage();