// cypress/support/commands/createRegularUsersGroup.cy.js

Cypress.Commands.add('createRegularUsersGroup', () => {
    cy.log('Creating/Updating Regular Users group via API');
    
    cy.request({
        method: 'POST',
        url: '/api/test-create-regular-users-group/',
        timeout: 30000,
        failOnStatusCode: false
    }).then((response) => {
        // Log the full response for debugging
        cy.log(`Response status: ${response.status}`);
        cy.log(`Response body: ${JSON.stringify(response.body)}`);
        
        if (response.status === 200) {
            if (response.body.status === 'success') {
                cy.log(`✓ ${response.body.message}`);
            } else {
                // Status 200 but error in body
                cy.log(`✗ API returned error: ${response.body.message}`);
                if (response.body.traceback) {
                    cy.log(`Traceback: ${response.body.traceback}`);
                }
                throw new Error(`Failed to create Regular Users group: ${response.body.message}`);
            }
        } else {
            cy.log(`✗ API request failed with status ${response.status}`);
            cy.log(`Error: ${response.body.message || 'Unknown error'}`);
            if (response.body.traceback) {
                cy.log(`Traceback: ${response.body.traceback}`);
            }
            throw new Error(`Failed to create/update Regular Users group (Status: ${response.status})`);
        }
    });
});