// cypress/support/commands/createVerifiedUser.cy.js
export const createVerifiedUser = () => {
  // Command to create a verified user for testing
  Cypress.Commands.add('createVerifiedUser', (email, password) => {
    cy.log(`Creating verified user with email: ${email}`)

    // Make a request to a custom Django view that creates a verified user
    cy.request({
      method: 'POST',
      url: '/api/test-create-user/',
      body: {
        email,
        password
      },
      timeout: 10000,  // Increase timeout to 10 seconds
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 200) {
        cy.log('User created successfully')
      } else {
        cy.log(`User creation failed with status ${response.status}: ${JSON.stringify(response.body)}`)
        // Try to create the user through the UI if the API fails
        cy.visit('/accounts/signup/')
        cy.get('#id_email').type(email)
        cy.get('#id_password1').type(password)
        cy.get('#id_password2').type(password)
        cy.get('button[type="submit"]').click()

        // If we get a verification message, that's fine
        cy.get('body').then(($body) => {
          const pageText = $body.text()
          if (pageText.includes('verification') || pageText.includes('Verification') ||
            pageText.includes('email') || pageText.includes('Email')) {
            cy.log('User created through UI with verification required')
            // Verify the user through the API
            cy.verifyUser(email)
          }
        })
      }
    })
  })

};

createVerifiedUser();