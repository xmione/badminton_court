// cypress/support/commands/logout.cy.js
export const logout = () => {
    Cypress.Commands.add('logout', () => {
        cy.get('a[href="/admin/logout/"]').click()
    })
};

logout();