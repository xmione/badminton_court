// cypress/support/commands/deletePaidBooking.cy.js

export const deletePaidBooking = () => {
  Cypress.Commands.add('deletePaidBooking', () => {

    cy.showWaitMessage('This Test will try to delete Paid Booking but the System should not allow it...', 10000);
    
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.wait(1000);
    
    // Find the row for Jane Smith's booking
    cy.contains('Jane Smith')
      .parent('tr') // Get the parent row
      .as('bookingRow'); // Create an alias for the row

    // Assert that the booking is marked as paid
    cy.get('@bookingRow')
      .find('.badge.bg-success') // Find the paid badge
      .contains('paid')
      .should('be.visible');

    // *** THIS IS THE KEY CHANGE ***
    // Assert that the delete link is NOT present in the row
    cy.get('@bookingRow')
      .find('a[href$="/delete/"]')
      .should('not.exist');

    // Optional: Navigate to the booking detail page to confirm there's no delete option there either
    cy.get('@bookingRow').find('a').contains('View').clickWithHighlight(); // Assuming there's a "View" link
    
    // Verify we're on the booking detail page
    cy.url().should('match', /\/bookings\/\d+\/$/);
    
    // Assert that the delete button is not present on the detail page
    cy.contains('button', 'Delete').should('not.exist');
    // Or if it's a link:
    // cy.contains('a', 'Delete').should('not.exist');

    cy.log('✓ Verified that paid booking cannot be deleted!');
    cy.showWaitMessage('Verified that paid booking cannot be deleted!', 3000);
  });
};

deletePaidBooking();