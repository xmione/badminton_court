// cypress/support/commands/login.cy.js

// Export the login command as a function
export const login = () => {
    Cypress.Commands.add('login', (username, password) => {
        cy.visit('/admin/login/')
        cy.get('#id_username').type(username)
        cy.get('#id_password').type(password)
        cy.get('input[type="submit"]').click()
    })
};

// Auto-register the command when this file is imported
login();