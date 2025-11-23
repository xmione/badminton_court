// cypress/support/commands/viewBookingDetails.cy.js

export const viewBookingDetails = () => {
  // Add an options object parameter with default values
  Cypress.Commands.add('viewBookingDetails', ({
    customerName = 'John Doe',
    courtName = 'Court 1',
    navigateBack = true // Option to control navigation back to the list
  } = {}) => {
    
    cy.showWaitMessage(`Viewing booking details for ${customerName}...`, 10000);
    cy.showStatusMessage(`Viewing ${customerName}'s booking details.`, {
      showSpinner: true,
      subText: 'Please wait...'
    });

    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.url().should('include', '/bookings/');
    cy.contains('h1', 'Bookings').should('be.visible');
    
    // *** CHANGE: Use the customerName parameter to find the correct booking ***
    cy.contains('td', customerName)
      .parent('tr')
      .find('a.btn-outline-primary') // Assuming this is the "View" button
      .first()
      .clickWithHighlight();

    cy.url().should('match', /\/bookings\/\d+\/$/);
    cy.contains('h1', 'Booking Details').should('be.visible');
    
    // *** CHANGE: Use parameters in assertions ***
    cy.contains('td', customerName).should('be.visible');
    cy.contains('td', courtName).should('be.visible');

    // *** CHANGE: Conditionally navigate back ***
    if (navigateBack) {
      cy.contains('a', 'Back to List').clickWithHighlight();
      cy.url().should('include', '/bookings/');
      cy.contains('h1', 'Bookings').should('be.visible');
    }
  });
};

viewBookingDetails();