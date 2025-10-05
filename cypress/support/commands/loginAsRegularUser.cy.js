// cypress/support/commands/loginAsRegularUser.cy.js

export const loginAsRegularUser = () => {
  Cypress.Commands.add('loginAsRegularUser', (email = 'paysol.postal@gmail.com', password = 'StrongPassword123!') => {
    // First check if the server is running
    cy.request({
        method: 'GET',
        url: '/',
        timeout: 5000,
        failOnStatusCode: false
    }).then((response) => {
        if (response.status !== 200) {
        cy.log('Server is not responding properly. Make sure Django server is running on localhost:8000');
        throw new Error('Server not responding');
        }
    });

    // Create a verified user using our updated endpoint
    cy.request({
        method: 'POST',
        url: '/api/test-create-user/',
        body: {
        email,
        password
        },
        timeout: 30000,
        failOnStatusCode: false
    }).then((response) => {
        if (response.status === 200) {
        cy.log('User created and verified successfully')
        } else {
        cy.log(`User creation failed: ${JSON.stringify(response.body)}`)
        }
    })
    
    // Now login with the user
    cy.visit('/accounts/login/')
    cy.get('#id_login').type(email)
    cy.get('#id_password').type(password)
    cy.get('button[type="submit"]').click()
    
    // Wait for login to complete and verify we're redirected to home page
    cy.url().should('eq', 'http://localhost:8000/')
    
    // Verify the user is actually authenticated by checking for the user dropdown in the navbar
    cy.get('.navbar-nav .dropdown-toggle').should('contain', email.split('@')[0])
    
    // Wait a moment for the page to fully load
    cy.wait(1000)
    })

};

loginAsRegularUser();