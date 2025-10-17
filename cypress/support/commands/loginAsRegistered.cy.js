// cypress/support/commands/loginAsRegistered.cy.js

export const loginAsRegistered = () => {
    Cypress.Commands.add('loginAsRegistered', (options = {}) => {
        // Use the existing email for consistency
        const email = 'admin@aeropace.test.local';
        
        // First, ensure the user doesn't exist from previous tests
        cy.request({
            method: 'POST',
            url: '/api/test-reset-database/',
            timeout: 10000,
            failOnStatusCode: false
        }).then((response) => {
            if (response.status === 200) {
                cy.log('Database reset successfully');
            } else {
                cy.log('Database reset failed, continuing with test');
            }
        });
        
        // Visit signup page
        cy.visit('/accounts/signup/');

        // Fill in registration form
        cy.get('#id_email').type(email);
        cy.get('#id_password1').type('StrongPassword123!');
        cy.get('#id_password2').type('StrongPassword123!');

        // Submit form
        cy.get('button[type="submit"]').click();

        // Wait for registration to complete
        cy.url().should('not.include', '/accounts/signup/');
        
        // Get the verification token
        cy.request({
            method: 'POST',
            url: '/api/get-verification-token/',
            body: { email },
            timeout: 10000,
            failOnStatusCode: false
        }).then((response) => {
            if (response.status === 200) {
                const token = response.body.token;
                // Visit the verification URL to complete the process
                cy.visit(`/accounts/confirm-email/${token}/`);
                cy.get('button[type="submit"]').click();
                
                // Now login with the verified user
                cy.visit('/accounts/login/');
                cy.get('#id_login').type(email);
                cy.get('#id_password').type('StrongPassword123!');
                cy.get('button[type="submit"]').click();
                
                // Verify successful login
                cy.url().should('eq', 'http://localhost:8000/');
                cy.get('.navbar-nav .dropdown-toggle').should('contain', email.split('@')[0]);
            } else {
                cy.log(`Failed to get verification token: ${JSON.stringify(response.body)}`);
                throw new Error('Failed to get verification token');
            }
        });
    });
};

loginAsRegistered();