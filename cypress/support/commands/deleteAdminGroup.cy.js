// cypress/support/commands/deleteAdminGroup.cy.js

// Command to delete an Administrators group via API
Cypress.Commands.add('deleteAdminGroup', () => {
    cy.log('Deleting Administrators group via API');
    
    // Make a request to delete the group
    cy.request({
        method: 'POST',
        url: '/api/test-delete-admin-group/',
        timeout: 30000
    }).then((response) => {
        if (response.status === 200) {
            cy.log(response.body.message);
        } else {
            cy.log(`Group deletion failed with status ${response.status}: ${JSON.stringify(response.body)}`);
            throw new Error('Failed to delete Administrators group');
        }
    });
});