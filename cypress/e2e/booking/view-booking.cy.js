// cypress/e2e/booking/view-booking.cy.js 
describe('Booking Management', () => {
  let statusId; 
  
  it('should view booking details', () => {
    cy.createNewBookingCommand(); 
    cy.viewBookingDetailsCommand();
  });
});