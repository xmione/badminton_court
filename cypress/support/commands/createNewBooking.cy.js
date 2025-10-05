// cypress/support/commands/createNewBooking.cy.js
export const createNewBooking = () => {
  Cypress.Commands.add('createNewBooking', () => {
    const statusId = cy.showStatusMessage('Creating new booking.', {
      showSpinner: true,
      subText: 'Please wait...'
    });

    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.url().should('include', '/bookings/');
    cy.contains('h1', 'Bookings').should('be.visible');
    cy.contains('a.btn-primary', 'New Booking').clickWithHighlight();
    cy.url().should('include', '/bookings/create/');

    cy.get('#id_customer', { timeout: 10000 }).should('be.visible').selectWithHighlight('John Doe');
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
    cy.get('#id_start_time').should('have.value', formatDateTime(tomorrow));
    cy.get('#id_end_time').invoke('val', formatDateTime(endTime));
    cy.get('#id_end_time').should('have.value', formatDateTime(endTime));
    cy.get('#id_fee').typeWithHighlight('20.00', { arrowPosition: 'right' });

    cy.showWaitMessage('Waiting to complete the form before submitting...', 5000);
    cy.get('button[type="submit"]').clickWithHighlight();

    cy.url().should('include', '/bookings/');
    cy.contains('Booking created successfully!').should('be.visible');
    cy.contains('John Doe').should('be.visible');
    cy.contains('Court 1').should('be.visible');
    cy.showWaitMessage('Successfully booked!...', 5000);
  });
};

createNewBooking();