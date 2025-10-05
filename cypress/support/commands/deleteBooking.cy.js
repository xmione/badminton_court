// cypress/support/commands/deleteBooking.cy.js
export const deleteBooking = () => {
  Cypress.Commands.add('deleteBooking', () => {

    cy.showWaitMessage('This Test will try to delete UnPaid Booking and System should allow it...', 10000)
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.wait(1000);
    
    // Verify the booking is marked as pending
    cy.contains('Jane Smith')
      .parent('tr') // Get the parent row
      .find('.badge.bg-warning') // Find the pending badge
      .contains('pending')
      .should('be.visible');
    
    // Click on the delete button for Jane Smith's booking
    cy.contains('Jane Smith')
      .parent('tr') // Get the parent row
      .find('a.btn-outline-danger') // Find the delete link with the correct class
      .first() // Get the first delete button in case there are multiple
      .clickWithHighlight();
    
    // Verify we're on the delete confirmation page
    cy.url().should('match', /\/bookings\/\d+\/delete\/$/);
    cy.contains('Delete Booking').should('be.visible');
    
    // Verify the booking details are shown
    cy.contains('Jane Smith').should('be.visible');
    cy.contains('Court 1').should('be.visible');
    
    // Debug: Check what buttons are available
    cy.get('body').then(($body) => {
      if ($body.find('button[type="submit"]').length > 0) {
        cy.log('Delete button found');
      } else {
        cy.log('Delete button NOT found');
        cy.screenshot('delete-button-missing');
      }
    });
    
    // Wait before confirming deletion
    cy.showWaitMessage('Confirming deletion of unpaid booking...', 3000);
    
    // Confirm deletion with highlight
    cy.get('button[type="submit"]').clickWithHighlight();
    
    // Debug: Check where we are redirected
    cy.url().then((url) => {
      cy.log(`Redirected to: ${url}`);
    });
    
    // Check for any success messages
    cy.get('body').then(($body) => {
      if ($body.text().includes('successfully')) {
        cy.log('Success message found');
      } else {
        cy.log('No success message found');
        cy.screenshot('no-success-message');
      }
    });
    
    // Verify the booking is no longer in the list
    cy.contains('Jane Smith').should('not.exist');
    
    cy.showWaitMessage('Unpaid booking deleted successfully!', 3000);
  });
};

deleteBooking();