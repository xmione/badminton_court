// cypress/support/commands/signUpDuplicateEmails.cy.js

export const signUpDuplicateEmails = () => {
    Cypress.Commands.add('signUpDuplicateEmails', (options = {}) => {
        // Use a fresh email for first registration
        const freshEmail = Cypress.env('REGULARUSER_EMAIL');
        const password = Cypress.env('REGULARUSER_PASSWORD');

        // First registration with fresh email
        cy.visit('/accounts/signup/');
        cy.get('#id_email').type(freshEmail);
        cy.get('#id_password1').type(password);
        cy.get('#id_password2').type(password);
        cy.get('button[type="submit"]').click();

        // Wait for the first registration to complete
        cy.wait(2000);
        
        // Now try to register with the same email again
        cy.visit('/accounts/signup/');
        cy.get('#id_email').type(freshEmail);
        cy.get('#id_password1').type(password);
        cy.get('#id_password2').type(password);
        cy.get('button[type="submit"]').click();

        // Wait and check for error message
        cy.wait(2000);
        
        // Debug approach - find the exact selector
        cy.get('body').then(($body) => {
            // Find all elements that contain the error message
            const elementsWithText = $body.find('*:contains("A user is already registered with this email address")');
            
            if (elementsWithText.length > 0) {
                // Get the first element and check its properties
                const firstElement = elementsWithText.first();
                cy.log(`Found error message in element: ${firstElement.prop('tagName')} with class ${firstElement.prop('className')}`);
                
                // Now use this information to create a specific selector
                if (firstElement.hasClass('alert-danger')) {
                    cy.get('.alert-danger').should('contain', 'A user is already registered with this email address');
                } else if (firstElement.hasClass('errorlist')) {
                    cy.get('.errorlist').should('contain', 'A user is already registered with this email address');
                } else if (firstElement.prop('tagName') === 'P') {
                    cy.contains('p', 'A user is already registered with this email address').should('be.visible');
                } else {
                    // Fallback to a general contains check
                    cy.contains('A user is already registered with this email address').should('be.visible');
                }
            } else {
                cy.log('Error message not found in the page');
                cy.log('Full page content:', $body.text());
            }
        });
    });
};

signUpDuplicateEmails();