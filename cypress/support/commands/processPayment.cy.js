// cypress/support/commands/processPayment.cy.js
/* How to use this command:
  // In your test file...

  describe('Booking and Payment Flow', () => {
    it('should create a booking and then process its payment', () => {
      // Step 1: Create a new booking
      cy.createNewBooking({
        customerName: 'Jane Smith',
        startHour: 9,
        durationHours: 3 // Creates a booking from 09:00 to 12:00
      });

      // Step 2: Process the payment for that specific booking using default payment details
      cy.processPayment('Jane Smith', '09:00 - 12:00');
    });

    it('should process a payment with custom details', () => {
      // Assume a booking for 'John Doe' from 14:00 to 16:00 already exists

      // Process the payment with custom amount and transaction ID
      cy.processPayment(
        'John Doe',          // customerName
        '14:00 - 16:00',    // timeSlot
        '25.00',             // amount
        'credit_card',         // method
        'TXN67890'            // transactionId
      );
    });
  });
*/

export const processPayment = () => {
  // Simplified parameters
  Cypress.Commands.add('processPayment', (
    customerName,
    amount = '20.00',
    method = 'cash',
    transactionId = 'TXN12345'
  ) => {
    
    cy.showWaitMessage(`Processing payment for ${customerName}'s booking...`, 10000);

    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.url().should('include', '/bookings/');

    // *** KEY CHANGE: Find the first booking for the customer ***
    // This is more reliable than searching for a specific time string
    cy.contains('td', customerName) // Find the cell with the customer's name
      .parents('tr')         // Get the parent row
      .first()               // Get the first matching row (the newest one)
      .as('targetBookingRow');   // Alias it

    // Navigate to that booking's detail page
    cy.get('@targetBookingRow')
      .find('a')
      .first()
      .clickWithHighlight();

    // Click on "Process Payment" button
    cy.contains('Process Payment').clickWithHighlight();

    // Fill out and submit the payment form
    cy.get('#id_amount', { timeout: 10000 }).should('be.visible').clear().typeWithHighlight(amount);
    cy.get('#id_payment_method').selectWithHighlight(method);
    cy.get('#id_transaction_id').typeWithHighlight(transactionId);

    cy.wait(1000); // Brief pause
    cy.get('button[type="submit"]').clickWithHighlight();

    // Verify payment was successful
    cy.contains('Payment processed successfully!').should('be.visible');
    cy.contains('paid').should('be.visible');

    cy.showWaitMessage(`Payment for ${customerName}'s booking completed!`, 5000);
  });
};

processPayment();