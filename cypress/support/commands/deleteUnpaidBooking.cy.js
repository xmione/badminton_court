// cypress/support/commands/deleteUnpaidBooking.cy.js

export const deleteUnpaidBooking = () => {
  Cypress.Commands.add('deleteUnpaidBooking', (customerName, startHour) => {
    const startTimeFormatted = `${String(startHour).padStart(2, '0')}:00`;

    cy.showWaitMessage(`This Test will delete ${customerName}'s ${startTimeFormatted} booking...`, 10000);
    
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.wait(1000);
    
    // Find the table row (<tr>) that contains both the customer's name and the start time
    cy.contains('tr', customerName)
      .filter(`:contains("${startTimeFormatted}")`)
      .as('bookingRow');

    // Use a .then() block to access the aliased element and log its HTML
    cy.get('@bookingRow').then(($tr) => {
      const trHtml = $tr[0].outerHTML;
      
      cy.log('Booking row HTML is:');
      cy.log(trHtml);
    });
    
    // Find the "Delete" link within that specific row and click it
    // The delete button is identified by the href containing '/delete/' or by the class
    cy.get('@bookingRow')
      .find('a[href*="/delete/"]')
      .clickWithHighlight();
    
    // Verify we're on the delete confirmation page
    cy.url().should('match', /\/bookings\/\d+\/delete\/$/);
    cy.contains('Delete Booking').should('be.visible');
    
    // Confirm deletion
    cy.get('button[type="submit"]').clickWithHighlight();
    
    // Assert that the specific booking row we found is no longer visible
    cy.get('@bookingRow').should('not.exist');
    
    cy.log(`✓ Unpaid booking for ${customerName} at ${startTimeFormatted} deleted successfully!`);
    cy.showWaitMessage(`Unpaid booking for ${customerName} at ${startTimeFormatted} deleted successfully!`, 3000);
  });
};

deleteUnpaidBooking();