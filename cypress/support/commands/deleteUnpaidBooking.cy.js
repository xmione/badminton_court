// cypress/support/commands/deleteUnpaidBooking.cy.js

export const deleteUnpaidBooking = () => {
  Cypress.Commands.add('deleteUnpaidBooking', () => {
    cy.showWaitMessage('This Test will delete an Unpaid Booking...', 10000);
    
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.wait(1000);
    
    // Find the row for Jane Smith's booking
    cy.contains('Jane Smith')
      .parent('tr') // Get the parent row
      .as('bookingRow'); // Create an alias for the row

    // Assert that the booking is marked as pending (unpaid)
    cy.get('@bookingRow')
      .find('.badge.bg-warning') // Find the pending badge
      .contains('pending')
      .should('be.visible');
    
    // Click on the delete button for Jane Smith's booking
    cy.get('@bookingRow')
      .find('a.btn-outline-danger') // Find the delete link with the correct class
      .first() // Get the first delete button in case there are multiple
      .clickWithHighlight();
    
    // Verify we're on the delete confirmation page
    cy.url().should('match', /\/bookings\/\d+\/delete\/$/);
    cy.contains('Delete Booking').should('be.visible');
    
    // Confirm deletion
    cy.get('button[type="submit"]').clickWithHighlight();
    
    // Verify the booking is no longer in the list
    cy.contains('Jane Smith').should('not.exist');
    
    cy.showWaitMessage('Unpaid booking deleted successfully!', 3000);
  });
};

deleteUnpaidBooking();