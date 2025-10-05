// cypress/support/commands/viewBookingDetails.cy.js
export const viewBookingDetails = () => {
  Cypress.Commands.add('viewBookingDetails', () => {
    
    cy.showWaitMessage('This Test will view newly created Booking...', 10000)
    const statusId = cy.showStatusMessage('Viewing booking details.', {
      showSpinner: true,
      subText: 'Please wait...'
    });

    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.url().should('include', '/bookings/');
    cy.contains('h1', 'Bookings').should('be.visible');
    cy.contains('td', 'John Doe').should('be.visible');

    cy.contains('td', 'John Doe')
      .parent('tr')
      .find('a.btn-outline-primary')
      .first()
      .clickWithHighlight();

    cy.url().should('match', /\/bookings\/\d+\/$/);
    cy.contains('h1', 'Booking Details').should('be.visible');
    cy.contains('td', 'John Doe').should('be.visible');
    cy.contains('td', 'Court 1').should('be.visible');

    cy.contains('a', 'Back to List').clickWithHighlight();
    cy.url().should('include', '/bookings/');
    cy.contains('h1', 'Bookings').should('be.visible');
  });
};

viewBookingDetails();