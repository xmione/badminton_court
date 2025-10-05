// cypress/e2e/booking/delete-booking.cy.js

describe('Booking Management', () => {
  
  it('should delete an unpaid booking', () => {
    cy.createDeleteBookingData();     
    cy.deleteBooking();
  });
});

