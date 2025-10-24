export const checkEmails = () => {
    Cypress.Commands.add('checkEmails', (email) => {
        cy.log(`Checking emails for: ${email}`);

        // First, check if there are any pending emails in the database
        cy.request({
            method: 'POST',
            url: '/api/check-pending-emails/',
            body: { email: email },
            failOnStatusCode: false
        }).then((response) => {
            cy.log('Pending emails response:', JSON.stringify(response.body));

            if (response.status === 200 && response.body.emails && response.body.emails.length > 0) {
                cy.log(`✅ Found ${response.body.emails.length} pending email(s)`);
                
                // If emails are found but not sent, trigger sending
                if (response.body.need_manual_send) {
                    cy.log('🔄 Triggering manual email sending...');
                    return cy.request({
                        method: 'POST',
                        url: '/api/send-pending-emails/',
                        body: { email: email },
                        failOnStatusCode: false
                    });
                }
            } else {
                cy.log('❌ No pending emails found in database');
            }
        }).then((sendResponse) => {
            if (sendResponse && sendResponse.status === 200) {
                cy.log('✅ Manual email sending triggered');
            }
        });
    });
};

checkEmails();