// cypress/support/commands/verifyUser.cy.js
export const verifyUser = () => {
  // Command to verify a user in the database
  Cypress.Commands.add('verifyUser', (email) => {
    cy.log(`Verifying user with email: ${email}`)

    // Make a request to a custom Django view that verifies a user
    cy.request({
      method: 'POST',
      url: '/api/test-verify-user/',
      body: {
        email
      },
      timeout: 10000,  // Increase timeout to 10 seconds
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 200) {
        cy.log('User verified successfully')
      } else {
        cy.log(`User verification failed with status ${response.status}: ${JSON.stringify(response.body)}`)
        // Continue with tests even if verification fails
      }
    })
  })

};

verifyUser();