// cypress/support/commands/adminLogin.cy.js
export const adminLogin = () => {
    // Command for admin login with setup
    Cypress.Commands.add('adminLogin', (username = 'admin', password = 'password', setup = true) => {
        if (setup) {
            cy.setupTestAdmin({ username, password })
        }

        cy.visit('/admin/login/')
        cy.get('#id_username').type(username)
        cy.get('#id_password').type(password)
        cy.get('input[type="submit"]').click()
    })

};

adminLogin();