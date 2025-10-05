// cypress/support/commands/resetDatabase.cy.js
export const resetDatabase = () => {
  // Command to reset the database
  Cypress.Commands.add('resetDatabase', () => {
    cy.log('Resetting database for clean test state')

    // Make a request to a custom Django view that resets the database
    cy.request({
      method: 'POST',
      url: '/api/test-reset-database/',
      timeout: 10000,  // Increase timeout to 10 seconds
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 200) {
        cy.log('Database reset successfully')
      } else {
        cy.log(`Database reset failed with status ${response.status}: ${JSON.stringify(response.body)}`)
      }
    })
  })

};

resetDatabase();