// cypress/support/commands/deletePaidBooking.cy.js
export const deletePaidBooking = () => {
  Cypress.Commands.add('deletePaidBooking', () => {

    cy.showWaitMessage('This Test will try to delete Paid Booking but the System should not allow it...', 10000)
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.wait(1000);
    
    // Verify the booking is marked as paid
    cy.contains('Jane Smith')
      .parent('tr') // Get the parent row
      .find('.badge.bg-success') // Find the paid badge
      .contains('paid')
      .should('be.visible');
    
    // Now try to delete the paid booking
    cy.contains('Jane Smith')
      .parent('tr') // Get the parent row
      .find('a[href$="/delete/"]') // Find link ending with /delete/
      .first() // Get the first match
      .clickWithHighlight();
    
    // Verify we're on the delete page but deletion is blocked
    cy.url().should('match', /\/bookings\/\d+\/delete\/$/);
    
    // Verify the warning message is shown
    cy.contains('Cannot Delete Booking').should('be.visible');
    cy.contains('This booking has been paid for and cannot be deleted.').should('be.visible');
    
    // Verify the delete button is not present
    cy.get('button[type="submit"]').should('not.exist');
    
    // Verify there's a back button
    cy.contains('Back to Booking').should('be.visible').clickWithHighlight();
    
    // Verify we're back on the booking detail page
    cy.url().should('match', /\/bookings\/\d+\/$/);
    
    cy.showWaitMessage('Verified that paid booking cannot be deleted!', 3000);
  });
};

deletePaidBooking();