// cypress/e2e/authentication/check-emails.cy.js
// To run: npx cypress open --env configFile=dev
//         npx cypress run --spec "cypress/e2e/authentication/check-emails.cy.js"
describe('Email Verification Check', () => {
    it('should check and send pending verification emails', () => {
        const testEmail = Cypress.env('REGULARUSER_EMAIL');
        
        cy.log(`Checking emails for: ${testEmail}`);
        
        // Check for pending emails
        cy.checkEmails(testEmail);
        
        // Wait a bit for email processing
        cy.wait(5000);
        
        // Check again to see if emails were sent
        cy.request({
            method: 'POST',
            url: '/api/check-pending-emails/',
            body: { email: testEmail },
            failOnStatusCode: false
        }).then((response) => {
            cy.log('Final email status:', JSON.stringify(response.body));
            
            if (response.body.emails && response.body.emails.length > 0) {
                const latestEmail = response.body.emails[0];
                cy.log(`Latest email - Sent: ${latestEmail.sent}, Expired: ${latestEmail.expired}`);
                
                if (latestEmail.sent) {
                    cy.log('✅ Email was successfully sent');
                } else {
                    cy.log('❌ Email was not sent - there may be an issue with email configuration');
                }
            }
        });
    });
});