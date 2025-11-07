// cypress/support/commands/posteioUserManagement.cy.js
// Command to add a new regular user to Poste.io
Cypress.Commands.add('addRegularUser', () => {
    // Get environment variables
    const regularUserEmail = Cypress.env('REGULARUSER_EMAIL');
    const regularUserFirstName = Cypress.env('REGULARUSER_FIRST_NAME');
    const regularUserLastName = Cypress.env('REGULARUSER_LAST_NAME');
    const regularUserPassword = Cypress.env('REGULARUSER_PASSWORD');

    // Verify environment variables are set
    if (!regularUserEmail || !regularUserFirstName || !regularUserPassword) {
        throw new Error('REGULARUSER_EMAIL, REGULAR_USER_FIRST_NAME, and REGULARUSER_PASSWORD must be set in Cypress environment.');
    }

    // Parse the email to get the username and domain parts
    const [username, domain] = regularUserEmail.split('@');

    cy.log(`Adding regular user: ${regularUserEmail}`);

    // 1. Set the viewport to a size where the sidebar is visible.
    cy.viewport(1280, 720);

    // 2. Use a highly specific selector that combines href and icon class.
     cy.get('.sidebar a[href="/admin/box/"]', { timeout: 10000 })
      .should('be.visible') // This waits for the element to be visible.
      .clickWithHighlight();

    cy.url().should('include', '/admin/box/');

    // 3. Click the "Create a new email" button.
    cy.get('a.add-query-domain[href="/admin/box/new"]').clickWithHighlight();
    cy.url().should('include', '/admin/box/new');

    // 4. Fill out the form
    cy.get('#name').clear().type(`${regularUserFirstName} ${regularUserLastName}`);
    cy.get('#user').clear().type(username);
    cy.get('#passwordPlaintext').clear().type(regularUserPassword);
    cy.get('#domain_chosen').click(); // Click the custom dropdown to open it
    cy.get('.chosen-results li').contains(domain).click(); // Click the desired option

    // 5. Submit the form
    cy.wait(3000);
    cy.contains('button', 'Submit').clickWithHighlight();

    cy.wait(3000);

    // 6. Verify the user was created successfully
    cy.url().should('include', `/admin/box/${regularUserEmail}`);
    cy.log(`User created successfully. Navigating back to list to avoid application error.`);
    
    // 7. Use a highly specific selector that combines href and icon class.
    cy.get('.sidebar a[href="/admin/box/"]', { timeout: 10000 })
      .should('be.visible') // This waits for the element to be visible.
      .clickWithHighlight();

    cy.url().should('include', '/admin/box/');

    // 8. Final verification: The user should now be visible in the list.
    cy.get('body').should('contain', regularUserEmail);
    cy.log(`Successfully verified user in list: ${regularUserEmail}`);
});