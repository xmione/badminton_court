// cypress/support/commands/signOut.cy.js

export const signOut = () => {
    Cypress.Commands.add('signOut', (options = {}) => {
        // First, ensure we're logged out
        cy.visit('/accounts/logout/');
        cy.get('button[type="submit"]').contains('Sign Out').click();
    });
};

signOut();
 