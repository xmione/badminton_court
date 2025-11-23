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
      subText: 'Please be wait...'
    }).then(id => {
      statusId = id;
      
      // Create test data for bookings (customers and courts)
      cy.updateStatusMessage(statusId, 'Creating test data for Bookings...', 'Please be patient...');
      
      cy.wait(1000);
      cy.createBookingTestData();
      
      // Login as a regular user
      cy.updateStatusMessage(statusId, 'Logging in as a Regular user...', 'Please be patient...');
      
      cy.wait(1000);
      cy.loginAsRegularUser();
    });
  });

  it('should create a new booking', () => {
    cy.pause();
    cy.createNewBooking();
  });

  it('should view booking details', () => {
    cy.pause();
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

