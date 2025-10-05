// cypress/e2e/booking/delete-paid-booking.cy.js

describe('Booking Management', () => {

    let statusId;
  before(() => {
    cy.log('BOOKING HAPPY PATH SPEC: Starting admin-login.cy.js before()');
    cy.showWaitMessage('This will process the Happy Path Booking Test.', 10000);

    cy.showStatusMessage('Resetting Database...', {
      showSpinner: true,
      subText: 'Please be wait...'
    }).then(id => {
      statusId = id; // Assign the ID returned by showStatusMessage
    });

    // Reset the database
    cy.resetDatabase();

    // Create test data for bookings (customers and courts)
    cy.updateStatusMessage(statusId, 'Creating test data for Bookings...', 'Please be patient...');

    cy.wait(1000) // Add a small wait
    cy.createBookingTestData();

    // Login as a regular user
    cy.updateStatusMessage(statusId, 'Logging in as a Regular user...', 'Please be patient...');

    cy.wait(1000) // Add a small wait
    cy.loginAsRegularUser();
  });

  beforeEach(() => {
    cy.log('BOOKING HAPPY PATH SPEC: Starting beforeEach()');

  });

  it('should not allow deletion of a paid booking', () => {
    
    cy.processPayment();     
    cy.deletePaidBooking();
  });
});

