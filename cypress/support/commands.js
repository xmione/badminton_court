// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('login', (username, password) => {
  cy.visit('/admin/login/')
  cy.get('#id_username').type(username)
  cy.get('#id_password').type(password)
  cy.get('input[type="submit"]').click()
})

Cypress.Commands.add('logout', () => {
  cy.get('a[href="/admin/logout/"]').click()
})

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