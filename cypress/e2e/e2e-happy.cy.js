// cypress/e2e/e2e-happy.cy.js
// isolation: true by default clears browser state. You need to login for each spec.
// here, you don't need to login in each spec.
describe('End-To-End Happy Path', { testIsolation: false }, () => {

  let statusId;

  it('should reset the Django database successfully', () => {
    cy.resetDjangoDb();
  });

  it('should reset the Poste.io database successfully', () => {
    cy.resetPosteioDb();
  });

  it('should ensure poste.io setup is complete and log in successfully', () => {
    // This single command now handles both setup and login, no matter the state.
    cy.setupPosteio();

    // If we reach this point, we are successfully logged in.
    cy.url().should('include', '/admin/');
    cy.get('h1').should('contain', 'Mailserver dashboard');
    
    cy.log('✓ Successfully logged in to Poste.io admin panel');
  });
 

  it('should add a new poste.io regular user successfully', () => {
    cy.log('Cleaning up test user...');
    cy.request({
      method: 'POST',
      url: '/api/test-cleanup-user/',
      body: { email: Cypress.env('REGULARUSER_EMAIL') },
      failOnStatusCode: false
    });
    // Use the new command to add the user defined in your .env file
    cy.addRegularUser();

    // You can add more assertions here if needed, e.g., checking for a success message.
  });
  
  it('should successfully login to admin panel', () => {
    cy.setupTestAdmin({ reset: true });
    cy.createAdminGroup();
    // Ensure admin user's email is verified
    cy.verifyUser(Cypress.env('ADMIN_EMAIL'))
    cy.loginToAdminPage();
  })
 
  it('should show error for invalid credentials', () => {
    cy.setupTestAdmin({ reset: false });
    cy.loginToAdminPageWithInvalidCredentials();
  })

  it('should successfully register a new user', () => {
    cy.createRegularUsersGroup();
    cy.signUp();
    cy.signOut();
  })

  it('should successfully login with registered user', () => {
    cy.loginAsRegistered();
    cy.signOut();
  })

  it('should show error for invalid login credentials', () => {
    cy.loginAsInvalidCredentials();
  })

  it('should show error for duplicate email during registration', () => {
    cy.signUpDuplicateEmails();
  })

  it('should show error for mismatched passwords during registration', () => {
    cy.signUpMismatchedPasswords();
  })
   
  it('should set up the database before running the Booking Happy Path Test', () => {
    cy.log('BOOKING HAPPY PATH SPEC: Starting admin-login.cy.js before()');
    cy.showWaitMessage('This will process the Happy Path Booking Test.', 10000);
    cy.showStatusMessage('Creating Test data for Bookings...', {
      showSpinner: true,
      subText: 'Please be patient...'
    }).then(id => {
      statusId = id;
      
      // Create test data for bookings (customers and courts)
      cy.updateStatusMessage(statusId, 'Creating test data for Bookings...', 'Please be patient...');
      cy.wait(1000);
  
      cy.setupTestAdmin();
      cy.wait(1000);
  
      cy.createBookingTestData();
      
      // Login as a regular user
      cy.updateStatusMessage(statusId, 'Logging in as a Regular user...', 'Please be patient...');
      
      cy.wait(1000);
      cy.loginAsRegularUser();
    });
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

