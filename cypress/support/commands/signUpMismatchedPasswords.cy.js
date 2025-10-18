// cypress/support/commands/signUpMismatchedPasswords.cy.js

export const signUpMismatchedPasswords = () => {
    // Command for admin login with setup
    // Now accepts a single options object
    Cypress.Commands.add('signUpMismatchedPasswords', (options = {}) => {
        // Visit signup page
        cy.visit('/accounts/signup/')

        // Fill in registration form with mismatched passwords
        const uniqueEmail = 'admin@aeropace.com'

        cy.get('#id_email').type(uniqueEmail)
        cy.get('#id_password1').type('StrongPassword123!')
        cy.get('#id_password2').type('DifferentPassword123!')

        // Submit form
        cy.get('button[type="submit"]').click()

        // Debug: Print the page content to see what's actually displayed
        cy.get('body').then(($body) => {
            cy.log('Page content after mismatched passwords:', $body.text())
        })

        // Verify error message - look for any password mismatch error
        cy.get('body').then(($body) => {
            const pageText = $body.text()

            if (pageText.includes('same password') || pageText.includes('match')) {
                cy.contains(/same password|match/i).should('be.visible')
            } else if (pageText.includes('password fields') || pageText.includes('password do')) {
                cy.contains(/password fields|password do/i).should('be.visible')
            } else if (pageText.includes('The two password') && pageText.includes("didn't match")) {
                cy.contains(/The two password.*didn't match/i).should('be.visible')
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
                            return el.textContent.match(/match|same|password.*did|didn.*match/i) &&
                                el.textContent.length < 200 // Avoid matching the entire page
                        }).first().should('be.visible')
                    }
                })
            }
        })
    });
};

signUpMismatchedPasswords();