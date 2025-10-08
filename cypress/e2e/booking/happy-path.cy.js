// cypress/e2e/booking/happy-path.cy.js
// isolation: true by default clears browser state. You need to login for each spec.
// here, you don't need to login in each spec.
describe('Booking Management', { testIsolation: false }, () => {

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

  it('should create a new booking', () => {
    cy.createNewBooking();
  });

  it('should view booking details', () => {
    cy.createNewBooking();
    cy.viewBookingDetails();
  });

  it('should process payment', () => {
    cy.processPayment();
  });

  it('should allow the editing of an existing booking', () => {
    cy.createBookingTestData(); 
    cy.editBooking();
  });

  it('should allow the deletion of an unpaid booking', () => {
    cy.createDeleteBookingData();     
    cy.deleteBooking();
  });

  it('should not allow deletion of a paid booking', () => {
    
    cy.processPayment();     
    cy.deletePaidBooking();
    
    cy.showStatusMessage('Aeropace Badminton Court Management System', {
      showSpinner: false,
      subText: 'The Happy Path Test for the Booking Process has ended!'
    });
  });
});

