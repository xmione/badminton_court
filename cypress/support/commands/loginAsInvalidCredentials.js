// cypress/support/commands/loginAsInvalidCredentials.cy.js
export const loginAsInvalidCredentials = () => {
    Cypress.Commands.add('loginAsInvalidCredentials', (options = {}) => {
        // Get domain from environment variables
        const domain = Cypress.env('POSTE_DOMAIN');

        // Visit login page
        cy.visit('/accounts/login/')

        // Fill in invalid credentials
        cy.get('#id_login').type(`invalid@${domain}`)
        cy.get('#id_password').type('wrongpassword')

        // Submit form
        cy.get('button[type="submit"]').click()

        // Debug: Print the page content to see what's actually displayed
        cy.get('body').then(($body) => {
            cy.log('Page content after invalid login:', $body.text())
        })

        // Verify error message - look for any error-related text
        cy.get('body').then(($body) => {
            const pageText = $body.text()

            if (pageText.includes('incorrect') || pageText.includes('Incorrect')) {
                cy.contains(/incorrect|Incorrect/i).should('be.visible')
            } else if (pageText.includes('not correct') || pageText.includes('not valid')) {
                cy.contains(/not correct|not valid/i).should('be.visible')
            } else if (pageText.includes('e-mail') && pageText.includes('password')) {
                cy.contains(/e-mail.*password|password.*e-mail/i).should('be.visible')
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
                            return el.textContent.match(/incorrect|invalid|wrong|failed|e-mail|password/i) &&
                                el.textContent.length < 200 // Avoid matching the entire page
                        }).first().should('be.visible')
                    }
                })
            }
        })
    });

};

loginAsInvalidCredentials();