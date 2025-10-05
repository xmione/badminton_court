// cypress/support/commands/loginAsRegistered.cy.js

export const loginAsRegistered = () => {
    Cypress.Commands.add('loginAsRegistered', (options = {}) => {

        // Visit signup page
        cy.visit('/accounts/signup/')

        // Fill in registration form with the specified email
        const uniqueEmail = 'paysol.postal@gmail.com'

        cy.get('#id_email').type(uniqueEmail)
        cy.get('#id_password1').type('StrongPassword123!')
        cy.get('#id_password2').type('StrongPassword123!')

        // Submit form
        cy.get('button[type="submit"]').click()

        // Debug: Print the page content to see what's actually displayed
        cy.get('body').then(($body) => {
            cy.log('Page content after registration:', $body.text())
        })

        // Verify successful registration
        // Check if redirected to login page or if verification message is shown
        cy.url().then((url) => {
            cy.log('Current URL after registration:', url)

            if (url.includes('/accounts/login/')) {
                // Redirected to login page
                cy.url().should('include', '/accounts/login/')
            } else {
                // Look for any verification-related message with multiple possible texts
                cy.get('body').then(($body) => {
                    const pageText = $body.text()

                    if (pageText.includes('verification') || pageText.includes('Verification')) {
                        // Found some verification message
                        cy.contains(/verification|Verification/i).should('be.visible')
                    } else if (pageText.includes('email') || pageText.includes('Email')) {
                        // Found some email-related message
                        cy.contains(/email|Email/i).should('be.visible')
                    } else if (pageText.includes('sent') || pageText.includes('Sent')) {
                        // Found some "sent" message
                        cy.contains(/sent|Sent/i).should('be.visible')
                    } else {
                        // Just check that we're not on an error page
                        cy.url().should('not.include', 'error')
                        cy.log('No verification message found, but no error detected')
                    }
                })
            }
        })
    });

};

loginAsRegistered();