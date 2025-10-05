// cypress/e2e/booking/delete-paid-booking.cy.js

describe('Booking Management', () => {
  
  it('should not allow deletion of a paid booking', () => {
    cy.processPayment();     
    cy.deletePaidBooking();
  });
});

