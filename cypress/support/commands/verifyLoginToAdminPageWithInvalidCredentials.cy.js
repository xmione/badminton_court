// cypress/support/commands/verifyLoginToAdminPageWithInvalidCredentials.cy.js

export const verifyLoginToAdminPageWithInvalidCredentials = () => {
    Cypress.Commands.add('verifyLoginToAdminPageWithInvalidCredentials', () => {
        cy.showWaitMessage('This Test will try to verify the invalid credentials in the Admin Page...', 10000)
       
        // Get the error note element and log its content
        cy.get(".errornote", { timeout: 5000 })
            .should("be.visible")
            .then(($errorNote) => {
                // Get the actual text content
                const errorText = $errorNote.text();
                cy.log(`Actual error text: "${errorText}"`);

                // Assert the content matches the actual Django error message
                expect(errorText).to.include('Please enter the correct username and password');
                expect(errorText).to.include('staff account');
            });

        cy.showWaitMessage('Invalid Admin credentials. You cannot view and manage the site...', 10000);
    })
};

verifyLoginToAdminPageWithInvalidCredentials();