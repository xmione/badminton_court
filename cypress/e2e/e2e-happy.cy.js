// cypress/e2e/e2e-happy.cy.js
// isolation: true by default clears browser state. You need to login for each spec.
// here, you don't need to login in each spec.
describe('End-To-End Happy Path', { testIsolation: false }, () => {

  // let statusId;
  // before(() => {
  //   cy.log('END-TO-END HAPPY PATH SPEC: Starting e2e-happy.cy.js before()');
  //   cy.showWaitMessage('This will process the Happy Path end-to-end Test.', 10000);

  //   cy.showStatusMessage('Resetting Database...', {
  //     showSpinner: true,
  //     subText: 'Please be wait...'
  //   }).then(id => {
  //     statusId = id; // Assign the ID returned by showStatusMessage
  //   });

  //   // Reset the database
  //   cy.resetDatabase();

  //   // Create test data for bookings (customers and courts)
  //   cy.updateStatusMessage(statusId, 'Creating test data for Bookings...', 'Please be patient...');

  //   cy.wait(1000) // Add a small wait
  //   cy.createBookingTestData();

  //   // Login as a regular user
  //   cy.updateStatusMessage(statusId, 'Logging in as a Regular user...', 'Please be patient...');

  //   cy.wait(1000) // Add a small wait
  //   cy.loginAsRegularUser();
  // });

  // beforeEach(() => {
  //   cy.log('END-TO-END HAPPY PATH SPEC: Starting beforeEach()');

  // });

  it('should pass end-to-end happy path test', () => {

    cy.showWaitMessage("Signing up...", 10000);
    cy.signUp();
    cy.showWaitMessage("Logging in...", 10000);
    cy.loginAsRegistered();
    cy.createNewBooking();
    cy.viewBookingDetails();
    cy.processPayment();
    cy.editBooking();
    cy.deleteBooking();
    cy.deletePaidBooking();
    cy.showStatusMessage('Aeropace Badminton Court Management System', {
      showSpinner: false,
      subText: 'The End-To-End Happy Path Test has ended!'
    });
  });

});

