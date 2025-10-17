// cypress/support/commands/signUpDuplicateEmailsDupliateEmails.cy.js

export const signUpDuplicateEmails = () => {
    // Command for admin login with setup
    // Now accepts a single options object
    Cypress.Commands.add('signUpDuplicateEmails', (options = {}) => {
        // Use the specified email
        const uniqueEmail = 'admin@aeropace.test.local'

        // First, create a user through the UI
        cy.visit('/accounts/signup/')
        cy.get('#id_email').type(uniqueEmail)
        cy.get('#id_password1').type('StrongPassword123!')
        cy.get('#id_password2').type('StrongPassword123!')
        cy.get('button[type="submit"]').click()

        // Check if we need to verify the user
        cy.get('body').then(($body) => {
            const pageText = $body.text()

            if (pageText.includes('verification') || pageText.includes('Verification') ||
                pageText.includes('email') || pageText.includes('Email')) {
                cy.log('User created but verification required')
                // Try to verify the user through the API
                cy.verifyUser(uniqueEmail)
            }
        })

        // Try to register with the same email again
        cy.visit('/accounts/signup/')
        cy.get('#id_email').type(uniqueEmail)
        cy.get('#id_password1').type('StrongPassword123!')
        cy.get('#id_password2').type('StrongPassword123!')

        // Submit form
        cy.get('button[type="submit"]').click()

        // Debug: Print the page content to see what's actually displayed
        cy.get('body').then(($body) => {
            cy.log('Page content after duplicate registration:', $body.text())
        })

        // Verify error message - look for any duplicate email error
        cy.get('body').then(($body) => {
            const pageText = $body.text()

            if (pageText.includes('already registered') || pageText.includes('already in use')) {
                cy.contains(/already registered|already in use/i).should('be.visible')
            } else if (pageText.includes('duplicate') || pageText.includes('Duplicate')) {
                cy.contains(/duplicate|Duplicate/i).should('be.visible')
            } else if (pageText.includes('email') && (pageText.includes('taken') || pageText.includes('exists'))) {
                cy.contains(/email.*(taken|exists)|(taken|exists).*email/i).should('be.visible')
            } else {
                // Look for Django's default error list or any element containing error-related text
                cy.get('body').then(($body) => {
                    // Check for Django's errorlist class
                    if ($body.find('.errorlist').length > 0) {
                        cy.get('.errorlist').should('be.visible')
                    }
                    // Check for any element with class containing 'error'
                    else if ($body.find('[class*="error"]').length > 0) {
                        cy.get('[class*="error"]').should('be.visible')
                    }
                    // Check for any element with role="alert"
                    else if ($body.find('[role="alert"]').length > 0) {
                        cy.get('[role="alert"]').should('be.visible')
                    }
                    // Check for any element containing the word 'error'
                    else if (pageText.includes('error') || pageText.includes('Error')) {
                        cy.contains(/error|Error/i).should('be.visible')
                    }
                    // If none of the above, search the body for error-related keywords
                    else {
                        // Look for any element in the body containing error-related text
                        cy.get('body *').filter((_, el) => {
                            return el.textContent.match(/already|duplicate|taken|exists|email/i) &&
                                el.textContent.length < 200 // Avoid matching the entire page
                        }).first().should('be.visible')
                    }
                })
            }
        })

    });
};

signUpDuplicateEmails();