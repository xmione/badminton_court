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
    })
};

loginToAdminPageWithInvalidCredentials();