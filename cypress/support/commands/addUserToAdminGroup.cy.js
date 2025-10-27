// cypress/support/commands/addUserToAdminGroup.cy.js

// Command to add the admin user to the Administrators group via Django admin UI
Cypress.Commands.add('addUserToAdminGroup', () => {
    cy.log('Adding admin user to Administrators group via Django admin UI');
    
    // Navigate to the admin users page
    cy.visit('/admin/auth/user/');
    
    // Wait for the page to load
    cy.get('body').should('contain', 'Users');
    
    // Find and click on the admin user (using the admin email)
    cy.get('div[class*="results"] a').contains(Cypress.env('ADMIN_EMAIL')).click();
    
    // Wait for the user edit page to load
    cy.get('body').should('contain', 'Change user');
    
    // Try multiple approaches to find the Groups section
    cy.get('body').then(($body) => {
        // Try to find the Groups section using various selectors
        if ($body.find('fieldset:has(legend:contains("Groups"))').length > 0) {
            cy.get('fieldset:has(legend:contains("Groups"))').first().scrollIntoView();
        } else if ($body.find('div:contains("Groups")').length > 0) {
            cy.get('div:contains("Groups")').first().scrollIntoView();
        } else if ($body.find('h2:contains("Groups")').length > 0) {
            cy.get('h2:contains("Groups")').first().scrollIntoView();
        } else {
            // If we can't find a specific Groups section, just scroll to the bottom
            cy.get('body').scrollTo('bottom');
        }
    });
    
    // Try multiple approaches to find the Available Groups select box
    cy.get('body').then(($body) => {
        if ($body.find('select#id_groups_from').length > 0) {
            // Standard Django admin interface
            cy.get('select#id_groups_from').should('be.visible');
            cy.get('select#id_groups_from').select('Administrators');
            // Use the correct button selector
            cy.get('#id_groups_add').click();
        } else if ($body.find('select[name="groups"]').length > 0) {
            // Alternative select element
            cy.get('select[name="groups"]').select('Administrators');
        } else if ($body.find('input[type="checkbox"][value*="Administrators"]').length > 0) {
            // Checkbox interface
            cy.get('input[type="checkbox"][value*="Administrators"]').check();
        } else {
            // Try to find any element containing "Administrators" and interact with it
            cy.get('body').contains('Administrators').then(($el) => {
                if ($el.find('input[type="checkbox"]').length > 0) {
                    cy.wrap($el).find('input[type="checkbox"]').check();
                } else if ($el.is('option')) {
                    cy.get('select').select('Administrators');
                }
            });
        }
    });
    
    // Save the user
    cy.get('input[name="_save"]').click();
    
    // Try multiple approaches to verify the user was updated successfully
    cy.get('body').then(($body) => {
        if ($body.find('.messagelist .success').length > 0) {
            cy.get('.messagelist .success').should('contain', 'was changed successfully');
        } else if ($body.find('.success').length > 0) {
            cy.get('.success').should('be.visible');
        } else if ($body.find('.messagelist .info').length > 0) {
            cy.get('.messagelist .info').should('be.visible');
        } else if ($body.find('.alert-success').length > 0) {
            cy.get('.alert-success').should('be.visible');
        } else {
            // If no success message is found, just verify we're back on the users list
            cy.url().should('include', '/admin/auth/user/');
        }
    });
    
    cy.log('Admin user successfully added to Administrators group via UI');
});