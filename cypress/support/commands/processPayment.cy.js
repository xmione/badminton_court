// cypress/support/commands/processPayment.cy.js
export const processPayment = () => {
  Cypress.Commands.add('processPayment', () => {
    
    cy.showWaitMessage('This Test will create new Booking and process Payment...', 10000)
    const statusId = cy.showStatusMessage('Creating new booking for Payment.', {
      showSpinner: true,
      subText: 'Please wait...'
    });
    
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    
    // Verify we're on the booking list page
    cy.url().should('include', '/bookings/');
    cy.contains('h1', 'Bookings').should('be.visible');
    
    // Find and click the "New Booking" button with highlight
    cy.contains('a.btn-primary', 'New Booking').clickWithHighlight();

    // Verify we're on the booking creation page
    cy.url().should('include', '/bookings/create/');
    cy.wait(1000)
    cy.get('#id_customer', { timeout: 10000 }).should('be.visible').selectWithHighlight('Jane Smith');
    cy.get('#id_court').selectWithHighlight('Court 1');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0);

    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    cy.get('#id_start_time').invoke('val', formatDateTime(tomorrow));
    cy.get('#id_end_time').invoke('val', formatDateTime(endTime));
    cy.get('#id_fee').typeWithHighlight('20.00', { arrowPosition: 'right' });

    cy.showWaitMessage('Check payment details before submitting...', 5000);
    cy.get('button[type="submit"]').clickWithHighlight();

    // Wait for booking to be created
    cy.showWaitMessage('Waiting for booking to be created...', 3000);

    // Now process payment with highlights
    cy.contains('Jane Smith').parent().parent().find('a').first().clickWithHighlight();
    cy.wait(2000);

    // Highlight the Process Payment button
    cy.contains('Process Payment').clickWithHighlight();

    // Fill payment form with highlights
    cy.get('#id_amount', { timeout: 10000 }).should('be.visible').clear().typeWithHighlight('20.00');
    cy.get('#id_payment_method').selectWithHighlight('cash');
    cy.get('#id_transaction_id').typeWithHighlight('TXN12345');

    // Wait before submitting
    cy.wait(3000);

    // Submit payment with highlight
    cy.get('button[type="submit"]').clickWithHighlight();

    // Verify payment was processed
    cy.contains('Payment processed successfully!').should('be.visible');
    cy.contains('paid').should('be.visible');

    // Highlight the back to booking details button
    //cy.contains('Back to Booking').clickWithHighlight();

    cy.showWaitMessage('Payment process completed!', 10000);
  });
};

processPayment();