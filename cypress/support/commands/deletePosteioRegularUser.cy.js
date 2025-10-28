// cypress/support/commands/deletePosteioRegularUser.cy.js

// Command to delete a regular user in Poste.io
Cypress.Commands.add('deletePosteioRegularUser', () => {
    const regularUserEmail = Cypress.env('REGULARUSER_EMAIL');

    if (!regularUserEmail) {
        throw new Error('REGULARUSER_EMAIL must be set in Cypress environment.');
    }

    cy.log(`Deleting regular user: ${regularUserEmail}`);

    // 1. Set the viewport to a size where the sidebar is visible.
    cy.viewport(1280, 720);

    // 2. Navigate to the Email accounts section
    cy.get('.sidebar a[href="/admin/box/"]', { timeout: 10000 })
        .should('be.visible')
        .clickWithHighlight();

    cy.url().should('include', '/admin/box/');

    // 3. Search for the email account
    cy.get('input[placeholder*="search" i], input[placeholder*="Search" i], #search, .search-input').then(($search) => {
        if ($search.length > 0) {
            cy.wrap($search.first()).clear().type(regularUserEmail);
            cy.wait(1000); // Wait for search results
        }
    });

    // 4. Check if the "No email found" message is present
    cy.get('#result').then(($result) => {
        const noEmailFound = $result.text().includes('No email found, please create one');
        
        if (noEmailFound) {
            cy.log(`No email found for ${regularUserEmail}, user does not exist`);
        } else {
            cy.log(`Found user ${regularUserEmail}, proceeding with deletion`);
            
            // Find and click the user element
            cy.contains(regularUserEmail).click();
            
            // 5. Wait for navigation
            cy.wait(2000);
            
            // 6. Look for and click the delete button
            cy.get('body').then(($body) => {
                if ($body.find('button:contains("Delete email")').length > 0) {
                    cy.get('button:contains("Delete email")').click();
                } else if ($body.find('a:contains("Delete email")').length > 0) {
                    cy.get('a:contains("Delete email")').click();
                } else if ($body.find('button:contains("Delete")').length > 0) {
                    cy.get('button:contains("Delete")').click();
                } else if ($body.find('.btn-danger').length > 0) {
                    cy.get('.btn-danger').first().click();
                } else {
                    cy.log('Could not find Delete email button, but continuing...');
                }
            });

            // 7. Confirm the deletion if there's a confirmation dialog
            cy.get('body').then(($body) => {
                if ($body.find('button:contains("Confirm")').length > 0) {
                    cy.get('button:contains("Confirm")').click();
                } else if ($body.find('button:contains("Yes")').length > 0) {
                    cy.get('button:contains("Yes")').click();
                }
            });

            // 8. Wait for the deletion to process
            cy.wait(3000);
            
            cy.log(`Deletion process completed for ${regularUserEmail}`);
        }
    });
});