// cypress/e2e/booking/happy-path.cy.js

describe('Booking Management', { testIsolation: false }, () => {

  let statusId;
  before(() => {
    // This setup block is fine, it prepares the overall state
    cy.log('BOOKING HAPPY PATH SPEC: Starting before()');
    cy.showWaitMessage('This will process the Happy Path Booking Test.', 10000);

    cy.showStatusMessage('Resetting Database...', {
      showSpinner: true,
      subText: 'Please be wait...'
    }).then(id => {
      statusId = id;
    });

    cy.resetDatabase();
    cy.updateStatusMessage(statusId, 'Creating test data for Bookings...', 'Please be patient...');
    cy.wait(1000);
    cy.setupTestAdmin();
    cy.wait(1000);
    cy.createBookingTestData();
    cy.updateStatusMessage(statusId, 'Logging in as a Regular user...', 'Please be patient...');
    cy.wait(1000);
    cy.loginAsRegularUser();
  });

  beforeEach(() => {
    // This is still useful for resetting state between tests if needed
    cy.log('BOOKING HAPPY PATH SPEC: Starting beforeEach()');
  });

  // *** IMPROVEMENT: Combine create and view into one atomic test ***
  it('should create and then view a new booking', () => {
    // Define the booking details we want to create and view
    const bookingDetails = {
      customerName: 'Jane Smith',
      courtName: 'Court 2',
      startTimeOffset: 0, // Today
      startHour: 9,      // 9 AM
      durationHours: 3 // 3 hours (so 9 AM to 12 PM)
    };

    // Step 1: Create the booking
    cy.createNewBooking(bookingDetails);

    // Step 2: Immediately view the details of the booking we just created
    // We pass the same details to ensure we're viewing the correct one
    cy.viewBookingDetails({
      customerName: bookingDetails.customerName,
      courtName: bookingDetails.courtName
    });
  });

  it('should process payment for an existing booking', () => {
    // Define the booking we want to create and pay for
    const bookingDetails = {
      customerName: 'Jane Smith',
      courtName: 'Court 2',
      startTimeOffset: 0, // Today
      startHour: 13,      // 1 PM
      durationHours: 3      // 3 hours (so 1 PM to 4 PM)
    };

    // Step 1: Create the booking
    cy.createNewBooking(bookingDetails);

    // Step 2: Process payment for the booking we just created
    // We only need to pass the customer name now
    cy.processPayment(bookingDetails.customerName);
  });

  it('should allow editing of an existing booking', () => {
    // This test is responsible for creating the data it needs to edit
    cy.createBookingTestData(); 
    cy.editBooking();
  });

  it('should allow the deletion of an unpaid booking', () => {
    // Step 1: Explicitly create a specific unpaid booking
    const bookingDetails = {
      customerName: 'John Doe',
      courtName: 'Court 2',
      startTimeOffset: 0, // Today
      startHour: 17,      // 5 PM
      durationHours: 1      // 1 hour, so 17:00 - 18:00
    };
    cy.createNewBooking(bookingDetails);

    // Step 2: Delete that specific booking by passing the customer name and start hour
    cy.deleteUnpaidBooking(bookingDetails.customerName, bookingDetails.startHour);
  });

  it('should not allow the deletion of a paid booking', () => {
    // Step 1: Explicitly create a specific booking
    const bookingDetails = {
      customerName: 'Jane Smith',
      courtName: 'Court 1',
      startTimeOffset: 0, // Today
      startHour: 11,      // 11 AM
      durationHours: 2      // 2 hours, so 11:00 - 13:00
    };
    cy.createNewBooking(bookingDetails);

    // Step 2: Process payment for that specific booking to make it a "paid" booking
    cy.processPayment(bookingDetails.customerName, '11:00 - 13:00');

    // Step 3: Attempt to delete that specific "paid" booking
    // We pass the exact customer and time slot to ensure we're testing the right one
    cy.deletePaidBooking(bookingDetails.customerName, '11:00 - 13:00');

    cy.showStatusMessage('Aeropace Badminton Court Management System', {
      showSpinner: false,
      subText: 'The Happy Path Test for the Booking Process has ended!'
    });
  });
});