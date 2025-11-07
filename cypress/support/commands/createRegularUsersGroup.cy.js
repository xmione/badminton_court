// cypress/support/commands/createRegularUsersGroup.cy.js

// Command to create or update a Regular Users group via Django management command
Cypress.Commands.add('createRegularUsersGroup', () => {
    cy.log('Creating/Updating Regular Users group via Django management command');
    
    // Execute the Django management command
    cy.exec('python manage.py create_regular_users_group', { 
        timeout: 60000, 
        failOnNonZeroExit: false 
    }).then((result) => {
        if (result.code === 0) {
            cy.log(result.stdout);
        } else {
            cy.log(`Command failed with exit code: ${result.code}`);
            cy.log(`Command stdout: ${result.stdout}`);
            cy.log(`Command stderr: ${result.stderr}`);
            
            // Try the API approach as fallback
            cy.log('Trying API approach as fallback...');
            cy.request({
                method: 'POST',
                url: '/api/test-create-regular-users-group/',
                timeout: 30000,
                failOnStatusCode: false
            }).then((response) => {
                if (response.status === 200) {
                    cy.log(response.body.message);
                } else {
                    cy.log(`API approach failed: ${response.body.message}`);
                    throw new Error('Failed to create/update Regular Users group');
                }
            });
        }
    });
});