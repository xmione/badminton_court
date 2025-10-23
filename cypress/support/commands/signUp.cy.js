// cypress/support/commands/signUp.cy.js

export const signUp = () => {
    Cypress.Commands.add('signUp', (options = {}) => {

        const uniqueEmail = Cypress.env('REGULARUSER_EMAIL');
        const password = Cypress.env('REGULARUSER_PASSWORD');

        cy.log(`Signing up with email: ${uniqueEmail}`);

        // Visit signup page and fill the registration form
        cy.visit('/accounts/signup/');
        cy.get('#id_email').type(uniqueEmail);
        cy.get('#id_password1').type(password);
        cy.get('#id_password2').type(password);

        // Submit form
        cy.get('button[type="submit"]').click();

        // Wait for redirect to confirmation page
        cy.url().should('include', '/accounts/confirm-email/', { timeout: 10000 });
        
        // Verify the email verification page is displayed
        cy.get('h1').should('contain', 'Verify Your Email Address');

        // Call API to get the verification token
        cy.request({
            method: 'POST',
            url: '/api/get-verification-token/',
            body: { email: uniqueEmail },
            failOnStatusCode: false
        }).then((response) => {
            cy.log('Token API Response Status:', response.status);
            cy.log('Token API Response:', JSON.stringify(response.body));
            
            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('token');
            const token = response.body.token;
            
            cy.log(`Verification token: ${token}`);
            
            // Debug - check if token is valid before using it
            cy.request({
                method: 'GET',
                url: `/api/debug-confirmation/${token}/`,
                failOnStatusCode: false
            }).then((debugResponse) => {
                cy.log('Token Debug Info:', JSON.stringify(debugResponse.body));
                
                // Log if token is expired
                if (debugResponse.body.is_expired) {
                    cy.log('WARNING: Token is already expired!');
                }
            });
            
            // Visit the verification URL
            cy.visit(`/accounts/confirm-email/${token}/`);
        });

        // Wait for page to load
        cy.wait(1000);
        
        // Check if we need to click a confirm button
        cy.get('body').then(($body) => {
            if ($body.find('button[type="submit"]').length > 0) {
                cy.log('Found confirmation button - clicking it');
                cy.get('button[type="submit"]').click();
                cy.wait(1000);
            }
        });

        // Take screenshot for debugging
        cy.screenshot('after-email-confirmation');

        // Check the result
        cy.get('body').then(($body) => {
            const bodyText = $body.text().toLowerCase();
            
            if (bodyText.includes('confirmed') || bodyText.includes('verified')) {
                cy.log('SUCCESS: Email confirmation successful');
            } else if (bodyText.includes('expired') || bodyText.includes('invalid')) {
                cy.log('ERROR: Token appears to be expired or invalid');
                cy.log('Page content:', bodyText.substring(0, 500));
                throw new Error('Email confirmation token is expired or invalid');
            } else {
                cy.log('WARNING: Unexpected page content');
                cy.log('Body text:', bodyText.substring(0, 500));
            }
        });

        // Verify we can now see a success state
        cy.url().then((url) => {
            if (url.includes('/accounts/login/')) {
                cy.log('Redirected to login page - verification successful');
            } else {
                // Should have success message on current page
                cy.get('body').should('satisfy', ($body) => {
                    const text = $body.text().toLowerCase();
                    return text.includes('confirmed') || 
                           text.includes('verified') || 
                           text.includes('success');
                });
            }
        });

        // Return the email
        cy.wrap(uniqueEmail);
    });
};

signUp();