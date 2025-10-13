// cypress/support/commands/verifyEmail.cy.js

export const verifyEmail = () => {
    Cypress.Commands.add('verifyEmail', (email) => {
        // Get the verification token for the email
        cy.request({
            method: 'POST',
            url: '/api/get-verification-token/',
            body: { email },
            timeout: 30000,
            failOnStatusCode: false
        }).then((response) => {
            if (response.status === 200) {
                const token = response.body.token;
                cy.log(`Retrieved verification token: ${token}`);
                
                // Visit the verification URL
                cy.visit(`/accounts/confirm-email/${token}/`);
                
                // Confirm the email
                cy.get('button[type="submit"]').click();
                
                // Wait for verification to complete
                cy.url().should('include', '/accounts/confirm-email/');
                cy.contains('Email Confirmed').should('be.visible');
            } else {
                cy.log(`Failed to get verification token: ${JSON.stringify(response.body)}`);
                throw new Error('Failed to get verification token');
            }
        });
    });
};

verifyEmail();