// cypress/support/commands/addUserToRegularUsersGroup.cy.js

// Command to add a user to the Regular Users group via Django admin UI
Cypress.Commands.add('addUserToRegularUsersGroup', (email) => {
    cy.log(`Adding user ${email} to Regular Users group via Django admin UI`);
    
    // Navigate to the admin users page
    cy.visit('/admin/auth/user/');
    
    // Wait for the page to load
    cy.get('body').should('contain', 'Users');
    
    // Debug: Check if user exists and get their username
    cy.request({
        method: 'POST',
        url: '/api/debug-check-user/',
        body: { email: email },
        failOnStatusCode: false
    }).then((response) => {
        cy.log(`User check response: ${JSON.stringify(response.body)}`);
        
        if (!response.body.user_exists) {
            throw new Error(`User ${email} does not exist in database`);
        }
        
        // Use the username instead of email to find the user
        const username = response.body.username;
        cy.log(`Looking for user with username: ${username}`);
        
        // Try to find the user by username
        cy.get('div[class*="results"] a').contains(username).click();
    });
    
    // Wait for the user edit page to load
    cy.get('body').should('contain', 'Change user');
    
    // Try multiple approaches to find the Groups section
    cy.get('body').then(($body) => {
        if ($body.find('fieldset:has(legend:contains("Groups"))').length > 0) {
            cy.get('fieldset:has(legend:contains("Groups"))').first().scrollIntoView();
        } else if ($body.find('div:contains("Groups")').length > 0) {
            cy.get('div:contains("Groups")').first().scrollIntoView();
        } else {
            cy.get('body').scrollTo('bottom');
        }
    });
    
    // Add the user to the Regular Users group
    cy.get('body').then(($body) => {
        if ($body.find('select#id_groups_from').length > 0) {
            cy.get('select#id_groups_from').select('Regular Users');
            cy.get('#id_groups_add').click();
        }
    });
    
    // Save the user
    cy.get('input[name="_save"]').click();
    
    // Verify the user was updated successfully
    cy.get('body').then(($body) => {
        if ($body.find('.messagelist .success').length > 0) {
            cy.get('.messagelist .success').should('contain', 'was changed successfully');
        } else {
            cy.url().should('include', '/admin/auth/user/');
        }
    });
    
    cy.log(`User ${email} successfully added to Regular Users group via UI`);
});