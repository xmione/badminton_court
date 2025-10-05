// cypress/e2e/booking/create-new-booking.cy.js

describe('Booking Management', () => {
  let statusId; 
  
  it('should create a new booking', () => {
    cy.createNewBooking();
  });
});

