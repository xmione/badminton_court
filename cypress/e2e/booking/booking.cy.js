// cypress/e2e/booking/booking.cy.js

describe('Booking Management', { testIsolation: false }, () => {
  /*
    
  it('should delete an unpaid booking', () => {
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.wait(1000);
    
    // Verify the booking is marked as paid
    cy.contains('Jane Smith')
      .parent('tr') // Get the parent row
      .find('.badge.bg-success') // Find the paid badge
      .contains('paid')
      .should('be.visible');
    
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

  it('should not allow deletion of a paid booking', () => {
    
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.wait(1000);
    
    // Verify the booking is marked as paid
    cy.contains('John Doe')
      .parent('tr') // Get the parent row
      .find('.badge.bg-success') // Find the paid badge
      .contains('paid')
      .should('be.visible');
    
    // Now try to delete the paid booking
    cy.contains('John Doe')
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

  */

  it('should pass booking happy path test', () => {
    cy.createNewBooking(); 
    cy.viewBookingDetails();
    cy.processPayment();
    cy.editBooking();
    cy.deleteBooking();
  });

  // Add more tests here...

});

