// cypress/support/commands/adminLogin.cy.js

export const adminLogin = () => {
    // Command for admin login with setup
    // Now accepts a single options object
    Cypress.Commands.add('adminLogin', (options = {}) => {
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

        const defaultOptions = {
            username: adminEmail,
            password: adminPassword,
            email: adminEmail,
            setup: true
        };

        const finalOptions = { ...defaultOptions, ...options };

        if (finalOptions.setup) {
            cy.log(`Creating Admin user with email: ${finalOptions.username}`);
            cy.setupTestAdmin({
                username: finalOptions.username,
                password: finalOptions.password,
                email: finalOptions.email
            });
        }

        cy.visit('/admin/login/');
        cy.get('#id_username').should("be.visible").clear().typeWithHighlight(finalOptions.username, { arrowPosition: 'right' });
        cy.get('#id_password').should("be.visible").clear().typeWithHighlight(finalOptions.password, { arrowPosition: 'right' });
        cy.showWaitMessage('Reviewing changes before submitting...', 3000);
        cy.get('input[type="submit"]', { timeout: 5000 })
            .should("be.visible")
            .clickWithHighlight();
    });
};

adminLogin();