// cypress/support/commands/loginAsRegistered.cy.js

export const loginAsRegistered = () => {
    Cypress.Commands.add('loginAsRegistered', (options = {}) => {
        const uniqueEmail = Cypress.env('REGULARUSER_EMAIL');
        const password = Cypress.env('REGULARUSER_PASSWORD');

        // First, ensure we're logged out
        cy.visit('/accounts/logout/');
        cy.get('button[type="submit"]').contains('Sign Out').click();

        // Now login properly
        cy.visit('/accounts/login/');
        cy.url().should('include', '/accounts/login/');

        cy.get('#id_login').type(uniqueEmail);
        cy.get('#id_password').type(password);
        cy.get('button[type="submit"]').click();
        
        // Verify successful login
        cy.url().should('eq', 'http://localhost:8000/');
        cy.get('.navbar-nav .dropdown-toggle').should('contain', uniqueEmail.split('@')[0]);
    });
};

loginAsRegistered();