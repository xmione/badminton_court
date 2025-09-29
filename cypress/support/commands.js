Cypress.Commands.add('login', (username, password) => {
  cy.visit('/admin/login/')
  cy.get('#id_username').type(username)
  cy.get('#id_password').type(password)
  cy.get('input[type="submit"]').click()
})

Cypress.Commands.add('logout', () => {
  cy.get('a[href="/admin/logout/"]').click()
})