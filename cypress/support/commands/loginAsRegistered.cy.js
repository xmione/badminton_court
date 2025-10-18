// cypress/support/commands/loginAsRegistered.cy.js

export const loginAsRegistered = () => {
    Cypress.Commands.add('loginAsRegistered', (options = {}) => {
        // Use the existing email for consistency
        const uniqueEmail = Cypress.env('ADMIN_EMAIL');
        const adminPassword = Cypress.env('ADMIN_PASSWORD');

        cy.signUp();
        // Now login with the verified user
        cy.visit('/accounts/login/');
        cy.get('#id_login').type(uniqueEmail);
        cy.get('#id_password').type(adminPassword);
        cy.get('button[type="submit"]').click();
        
        // Verify successful login
        cy.url().should('eq', 'http://localhost:8000/');
        cy.get('.navbar-nav .dropdown-toggle').should('contain', uniqueEmail.split('@')[0]);
            
    });
};

loginAsRegistered();