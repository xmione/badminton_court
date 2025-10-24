// cypress/support/commands/loginToAdminPageWithInvalidCredentials.cy.js

export const loginToAdminPageWithInvalidCredentials = () => {
    Cypress.Commands.add('loginToAdminPageWithInvalidCredentials', () => {
        cy.showWaitMessage('This Test will try to log user as Admin with invalid credentials in the Admin Page and should fail...', 10000)
        
        // Use invalid credentials for this test
        cy.adminLogin({ 
            username: 'invalid_user', 
            password: 'wrong_password', 
            setup: false 
        });
        
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

loginToAdminPageWithInvalidCredentials();