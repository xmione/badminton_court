import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// -------------------------------------------------------------------
// Background
// -------------------------------------------------------------------
Given('the database is reset after migration', () => {
  cy.resetDatabase();
});

Given('the Django database is reset', () => {
  cy.resetDjangoDb();
});

Given('the admin user exists', () => {
  cy.setupTestAdmin({ reset: true });
});

Given('the Poste.io database is reset', () => {
  cy.resetPosteioDb();
});

Given('the admin email is verified', () => {
  cy.verifyUser(Cypress.env('ADMIN_EMAIL'));
});

// -------------------------------------------------------------------
// Poste.io
// -------------------------------------------------------------------
When('I set up Poste.io and log in', () => {
  cy.setupPosteio();
});

Then('I should see the Poste.io dashboard', () => {
  cy.url().should('include', '/admin/');
  cy.get('h1').should('contain', 'Mailserver dashboard');
});

Given('I clean up the test regular user', () => {
  cy.request({
    method: 'POST',
    url: '/api/test-cleanup-user/',
    body: { email: Cypress.env('REGULARUSER_EMAIL') },
    failOnStatusCode: false
  });
});

When('I add a new Poste.io regular user', () => {
  cy.addRegularUser();
});

Then('a success message should appear', () => {
  // Add an assertion if your addRegularUser command shows a success message,
  // or simply rely on the absence of errors.
  cy.contains(/success/i).should('exist');
});

// -------------------------------------------------------------------
// Admin login
// -------------------------------------------------------------------
Given('the admin user exists and is verified', () => {
  cy.setupTestAdmin({ reset: true });
  cy.verifyUser(Cypress.env('ADMIN_EMAIL'));
});

Given('the Administrators group exists', () => {
  cy.createAdminGroup();
});

When('I log in to the admin panel', () => {
  cy.loginToAdminPage();
});

Then('I should be on the admin dashboard', () => {
  cy.url().should('include', '/admin');
});

Given('the admin user exists (without reset)', () => {
  cy.setupTestAdmin({ reset: false });
});

When('I attempt to log in to the admin panel with invalid credentials', () => {
  cy.loginToAdminPageWithInvalidCredentials();
});

Then('I should see an error message', () => {
  cy.verifyLoginToAdminPageWithInvalidCredentials();
});

// -------------------------------------------------------------------
// Scenario: Add admin user to the Administrators group
// -------------------------------------------------------------------
When('I add the admin user to the Administrators group', () => {
  cy.addUserToAdminGroup();
});

Then('I should see a confirmation that the user was added', () => {
  // Adjust the assertion based on your actual success message or UI indicator
  cy.verifyAdminGroupAddition();
});

// -------------------------------------------------------------------
// Registration & Login
// -------------------------------------------------------------------
Given('the Regular Users group exists', () => {
  cy.createRegularUsersGroup();
});

When('I register a new user', () => {
  cy.signUp();
});

When('I sign out', () => {
  cy.signOut();
});

Then('the registration should succeed', () => {
  // Customise based on actual success indicator
  cy.contains('Welcome').should('be.visible');
});

When('I log in with the registered user', () => {
  cy.loginAsRegistered();
});

Then('the login should succeed', () => {
  cy.url().should('include', '/dashboard');
});

When('I attempt to log in with invalid credentials', () => {
  cy.loginAsInvalidCredentials();
});

When('I try to register with a duplicate email', () => {
  cy.signUpDuplicateEmails();
});

Then('I should see a duplicate email error', () => {
  cy.contains('already exists').should('be.visible');
});

When('I try to register with mismatched passwords', () => {
  cy.signUpMismatchedPasswords();
});

Then('I should see a password mismatch error', () => {
  cy.contains('passwords do not match').should('be.visible');
});

// -------------------------------------------------------------------
// Bookings (reusing the existing custom commands)
// -------------------------------------------------------------------
Given('booking test data has been created', () => {
  cy.createBookingTestData();
});

Given('I am logged in as a regular user', () => {
  cy.loginAsRegularUser();
});

When('I create a new booking for {string} on {string} at {int} AM for {int} hours',
  (customerName, courtName, startHour, duration) => {
    const bookingDetails = {
      customerName,
      courtName,
      startTimeOffset: 0,
      startHour,
      durationHours: duration
    };
    cy.createNewBooking(bookingDetails);
  }
);

When('I view the booking details for {string} on {string}', (customerName, courtName) => {
  cy.viewBookingDetails({ customerName, courtName });
});

Then('the booking details should be displayed correctly', () => {
  cy.contains('Booking details').should('be.visible');
});

When('I process payment for that booking', () => {
  // The previous step created the booking, assume we can rely on the last created
  // Alternatively, pass the customer name which we know from the scenario.
  cy.processPayment('Jane Smith');
});

Then('the payment should be confirmed', () => {
  cy.contains('Payment successful').should('be.visible');
});

When('I edit an existing booking', () => {
  cy.editBooking();
});

Then('the booking should be updated', () => {
  cy.contains('Booking updated').should('be.visible');
});

When('I create an unpaid booking for {string} on {string} at {int} PM for {int} hour(s)',
  (customerName, courtName, startHour, duration) => {
    const bookingDetails = {
      customerName,
      courtName,
      startTimeOffset: 0,
      startHour: startHour + 12, // 12-hour conversion for PM
      durationHours: duration
    };
    cy.createNewBooking(bookingDetails);
  }
);

When('I delete that unpaid booking', () => {
  cy.deleteUnpaidBooking('John Doe', 17); // from the scenario values
});

Then('the booking should be removed', () => {
  cy.contains('Booking deleted').should('be.visible');
});

When('I create a booking for {string} on {string} at {int} AM for {int} hours',
  (customerName, courtName, startHour, duration) => {
    const bookingDetails = {
      customerName,
      courtName,
      startTimeOffset: 0,
      startHour,
      durationHours: duration
    };
    cy.createNewBooking(bookingDetails);
  }
);

When('I pay for that booking', () => {
  cy.processPayment('Jane Smith', '11:00 - 13:00');
});

When('I try to delete that paid booking', () => {
  cy.deletePaidBooking('Jane Smith', '11:00 - 13:00');
});

Then('I should see an error that paid bookings cannot be deleted', () => {
  cy.contains('Cannot delete a paid booking').should('be.visible');
});