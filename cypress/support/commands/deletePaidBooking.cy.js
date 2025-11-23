// cypress/support/commands/deletePaidBooking.cy.js

export const deletePaidBooking = () => {
  // Add a parameter for customerName with a default value
  Cypress.Commands.add('deletePaidBooking', (customerName = 'Jane Smith') => {
    cy.showWaitMessage('This Test will try to delete a Paid Booking but the System should not allow it...', 10000);
    
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.wait(1000);
    
    // Find the row for the specified customer's paid booking
    cy.get('.badge.bg-success')
      .contains('paid')
      .parents('tr')
      .contains(customerName) // Use the parameter here
      .parents('tr')
      .as('bookingRow');

    // Navigate to the booking detail page
    cy.get('@bookingRow')
      .find('a')
      .first()
      .clickWithHighlight();
    
    // Verify we're on the booking detail page
    cy.url().should('match', /\/bookings\/\d+\/$/);
    
    // Click on the Delete link to go to the confirmation page
    cy.contains('a', 'Delete').should('be.visible').click();
    
    // Verify we are on the delete page and it shows the correct error
    cy.url().should('match', /\/bookings\/\d+\/delete\/$/);
    
    // Check for the blocking reason text that your view should be showing in the template
    cy.contains('Cannot Delete Booking').should('be.visible');
    cy.contains('This booking has been paid for and cannot be deleted.').should('be.visible');

    // Verify that the delete button is NOT PRESENT
    cy.get('button[type="submit"]').should('not.exist');

    // Go back to the detail page to clean up for other tests
    cy.go('back');
    cy.url().should('match', /\/bookings\/\d+\/$/);

    cy.log(`✓ Verified that paid booking for ${customerName} cannot be deleted!`);
    cy.showWaitMessage(`Verified that paid booking for ${customerName} cannot be deleted!`, 3000);
  });
};

deletePaidBooking();