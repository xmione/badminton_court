// cypress/support/commands/adminLogin.cy.js

export const adminLogin = () => {
    // Command for admin login with setup
    // Now accepts a single options object
    Cypress.Commands.add('adminLogin', (options = {}) => {
        const defaultOptions = {
            username: 'admin',
            password: 'password',
            setup: true
        };
        const finalOptions = { ...defaultOptions, ...options }; // Merge defaults with provided options

        if (finalOptions.setup) {
            cy.setupTestAdmin({ username: finalOptions.username, password: finalOptions.password });
        }

        cy.visit('/admin/login/');
        cy.get('#id_username').should("be.visible").type(finalOptions.username); // Use username from options
        cy.get('#id_password').should("be.visible").type(finalOptions.password); // Use password from options
        cy.get('input[type="submit"]', {timeout: 5000})
        .should("be.visible")
        .click();

        
    });
};

adminLogin();