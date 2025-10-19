// cypress/support/commands/signUp.cy.js

export const signUp = () => {
    // Command for user signup and email verification
    // Now performs the complete flow: signup -> get token -> verify email
    Cypress.Commands.add('signUp', (options = {}) => {

        // 1. Generate a unique email for this test run to prevent conflicts
        const uniqueEmail = Cypress.env('ADMIN_EMAIL');
        const password = Cypress.env('ADMIN_PASSWORD');

        cy.log(`Signing up with new email: ${uniqueEmail}`);

        // 2. Visit signup page and fill the registration form
        cy.visit('/accounts/signup/');
        cy.get('#id_email').type(uniqueEmail);
        cy.get('#id_password1').type(password);
        cy.get('#id_password2').type(password);

        // Submit form
        cy.get('button[type="submit"]').click();

        // 3. Verify the "verification email sent" message is visible
        // This confirms Django has processed the signup and sent the email.
        cy.contains(/verification email sent/i, { timeout: 10000 }).should('be.visible');

        // 4. Call the custom API to retrieve the verification token from the database
        cy.request({
            method: 'POST',
            url: '/api/get-verification-token/',
            body: { email: uniqueEmail },
        }).then((response) => {
            // 5. Assert the API call was successful and extract the token
            expect(response.status).to.equal(200, 'API to get verification token failed');
            expect(response.body).to.have.property('token', 'Token not found in API response');
            
            const token = response.body.token;
            cy.log(`Retrieved verification token: ${token}`);

            // 6. Visit the verification URL to confirm the email address
            cy.visit(`/accounts/confirm-email/${token}/`);

            // 7. Assert that the confirmation was successful on the UI
            cy.contains('Email Confirmed').should('be.visible');
            cy.log('Email successfully verified.');
        });

        // 8. Return the unique email address so it can be used by later commands in the test
        // e.g., cy.signUp().then((email) => cy.login(email, password));
        cy.wrap(uniqueEmail);
    });
};

signUp();