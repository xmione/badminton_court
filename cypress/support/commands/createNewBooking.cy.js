// cypress/support/commands/createNewBooking.cy.js
/*
// Example usage in a test file

  // Create a default booking (for tomorrow, 1 hour, at 10 AM)
  cy.createNewBooking();

  // Create a 2-hour booking for tomorrow at 2 PM
  cy.createNewBooking({
    durationHours: 2,
    startHour: 14
  });

  // Create a booking for next week
  cy.createNewBooking({
    startTimeOffset: 7,
    customerName: 'Jane Smith'
  });

  // Create a booking that will conflict with the default one
  // This should now trigger your validation error
  cy.createNewBooking({
    customerName: 'Jane Smith', // Different customer
    courtName: 'Court 1',      // Same court
    startTimeOffset: 1,        // Same day but this means TOMORROW
    startHour: 10            // Same time
  });

  // This creates a booking for today at 10 AM
  cy.createNewBooking({
    customerName: 'Jane Smith',
    courtName: 'Court 1',
    startTimeOffset: 0, // This means TODAY
    startHour: 10
  });

*/

export const createNewBooking = () => {
  // Add an options object parameter with default values, including scheduling
  Cypress.Commands.add('createNewBooking', ({
    customerName = 'John Doe',
    courtName = 'Court 1',
    fee = '20.00',
    startTimeOffset = 1, // Days from now to schedule the booking (default: 1 day)
    durationHours = 1,     // Duration of the booking in hours (default: 1 hour)
    startHour = 10         // Starting hour in 24-hour format (default: 10 AM)
  } = {}) => {
    
    cy.showWaitMessage(`This Test will create a new Booking for ${customerName}...`, 10000)
    const statusId = cy.showStatusMessage(`Creating new booking for ${customerName}.`, {
      showSpinner: true,
      subText: 'Please wait...'
    });

    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.url().should('include', '/bookings/');
    cy.contains('h1', 'Bookings').should('be.visible');
    cy.contains('a.btn-primary', 'New Booking').clickWithHighlight();
    cy.url().should('include', '/bookings/create/');

    // Use the customerName and courtName parameters
    cy.get('#id_customer', { timeout: 10000 }).should('be.visible').selectWithHighlight(customerName);
    cy.get('#id_court').selectWithHighlight(courtName);

    // *** CHANGE: Use the scheduling parameters to calculate dates ***
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + startTimeOffset);
    startTime.setHours(startHour, 0, 0, 0); // Set to the start of the hour

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + durationHours);

    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Use the calculated dates
    cy.get('#id_start_time').invoke('val', formatDateTime(startTime));
    cy.get('#id_start_time').should('have.value', formatDateTime(startTime));
    cy.get('#id_end_time').invoke('val', formatDateTime(endTime));
    cy.get('#id_end_time').should('have.value', formatDateTime(endTime));
    
    // Use the fee parameter
    cy.get('#id_fee').typeWithHighlight(fee, { arrowPosition: 'right' });

    cy.showWaitMessage('Waiting to complete the form before submitting...', 5000);
    cy.get('button[type="submit"]').clickWithHighlight();

    cy.url().should('include', '/bookings/');
    cy.contains('Booking created successfully!').should('be.visible');
    
    // Use parameters in assertions
    cy.contains(customerName).should('be.visible');
    cy.contains(courtName).should('be.visible');
    cy.showWaitMessage(`Successfully booked for ${customerName}!`, 5000);
  });
};

createNewBooking();