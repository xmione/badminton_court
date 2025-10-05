// cypress/support/commands/editBooking.cy.js
export const editBooking = () => {
  Cypress.Commands.add('editBooking', () => {
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    
    // Verify we're on the booking list page
    cy.url().should('include', '/bookings/');
    cy.contains('h1', 'Bookings').should('be.visible');
    
    // Find an existing booking and click the edit button
    cy.contains('td', 'John Doe')
      .parent('tr') // Get the parent row
      .find('a[href$="/update/"]') // Find link ending with /update/
      .first() // Get the first match
      .clickWithHighlight();
    
    // Verify we're on the edit page
    cy.url().should('match', /\/bookings\/\d+\/update\/$/);
    
    // Wait for the form to load
    cy.wait(1000);
    
    // Modify the booking details
    cy.get('#id_court').selectWithHighlight('Court 2'); // Change court
    
    // Change start time to tomorrow at 14:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0);
    
    // Change end time to tomorrow at 15:30
    const endTime = new Date(tomorrow);
    endTime.setHours(15, 30);
    
    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    // Update the times with highlight
    cy.get('#id_start_time').invoke('val', formatDateTime(tomorrow));
    cy.get('#id_start_time').should('have.value', formatDateTime(tomorrow));
    
    cy.get('#id_end_time').invoke('val', formatDateTime(endTime));
    cy.get('#id_end_time').should('have.value', formatDateTime(endTime));
    
    // Update the fee with highlight
    cy.get('#id_fee').clear().typeWithHighlight('30.00', {arrowPosition: 'right'});
    
    // Wait before submitting
    cy.showWaitMessage('Reviewing changes before submitting...', 3000);
    
    // Submit the form with highlight
    cy.get('button[type="submit"]').clickWithHighlight();
    
    // Verify success
    cy.contains('Booking updated successfully!').should('be.visible');
    
    // Verify the changes were applied
    cy.contains('Court 2').should('be.visible');
    cy.contains('$30.00').should('be.visible');
    
    cy.showWaitMessage('Booking updated successfully!', 3000);
  });
};

editBooking();