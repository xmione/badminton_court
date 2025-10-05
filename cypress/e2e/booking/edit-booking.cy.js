// cypress/e2e/booking/create-new-booking.cy.js

describe('Booking Management', () => {
  let statusId; 
  
  it('should edit an existing booking', () => {
    cy.createBookingTestData(); 
    cy.editBooking();
  });
});

