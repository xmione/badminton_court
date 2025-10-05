// cypress/e2e/booking/happy-path.cy.js

describe('Booking Management', { testIsolation: false }, () => {

  it('should pass booking happy path test', () => {
    cy.showWaitMessage('This will process the Happy Path Booking Test.', 10000);
    cy.createNewBooking(); 
    cy.viewBookingDetails();
    cy.processPayment();
    cy.editBooking();
    cy.deleteBooking();
    cy.deletePaidBooking();
    cy.showWaitMessage('Booking Happy Path Test has ended.', 5000);

  });

  // Add more tests here...

});

