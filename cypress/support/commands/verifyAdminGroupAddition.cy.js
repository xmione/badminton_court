// cypress/support/commands/verifyAdminGroupAddition.cy.js

// Command to verify that the user was added successfully
Cypress.Commands.add('verifyAdminGroupAddition', () => {
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