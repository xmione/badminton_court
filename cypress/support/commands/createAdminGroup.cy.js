// cypress/support/commands/createAdminGroup.cy.js

// Command to create or update an Administrators group via API
Cypress.Commands.add('createAdminGroup', () => {
    cy.log('Creating/Updating Administrators group via API');
    
    // Make a request to create or update the group
    cy.request({
        method: 'POST',
        url: '/api/test-create-admin-group/',
        timeout: 30000
    }).then((response) => {
        if (response.status === 200) {
            cy.log(response.body.message);
        } else {
            cy.log(`Group operation failed with status ${response.status}: ${JSON.stringify(response.body)}`);
            throw new Error('Failed to create/update Administrators group');
        }
    });
});