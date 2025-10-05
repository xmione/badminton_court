// cypress/e2e/booking/booking.cy.js

describe('Booking Management', { testIsolation: false }, () => {
  let statusId; // Declare the variable to hold the status ID
  let testErrors = []; // Array to collect errors

  before(() => {
    // Show initial status message before any tests run
    cy.showStatusMessage('Aeropace Badminton Court Management System.', {
      showSpinner: true,
      subText: 'Booking Process Happy Path Test.'
    }).then((id) => {
      // Store the returned ID for use in other hooks
      statusId = id;
    });

    cy.wait(3000)

    // Update the status message for each test
    cy.updateStatusMessage(statusId, 'Clearing cookies and localStorage to ensure clean state...', 'This may take a moment...');

    // Clear cookies and localStorage to ensure clean state
    cy.clearCookies();
    cy.clearLocalStorage();

    cy.updateStatusMessage(statusId, 'Initializing database...', 'Please be patient...');

    // Run Django migrations to ensure tables exist
    cy.exec('python manage.py migrate', { timeout: 60000, failOnNonZeroExit: false })
      .then((result) => {
        if (result.code !== 0) {
          cy.log(`Migration failed: ${result.stderr}`);
        } else {
          cy.log('Migrations completed successfully');
        }
      });

    // Reset the database
    cy.resetDatabase();

    // Create test data for bookings (customers and courts)
    cy.updateStatusMessage(statusId, 'Creating test data for Bookings...', 'Please be patient...');
    cy.createBookingTestData();

    // Login as a regular user
    cy.updateStatusMessage(statusId, 'Logging in as a Regular user...', 'Please be patient...');
    cy.loginAsRegularUser();

    // Set up error collection with stack trace
    Cypress.on('fail', (error, runnable) => {
      // Collect error details including stack trace
      testErrors.push({
        test: runnable.title,
        error: error.name,
        message: error.message,
        stack: error.stack, // Add stack trace
        timestamp: new Date().toISOString()
      });
      
      // Re-throw the error to fail the test
      throw error;
    });
  });
  
  after(() => {
    // Hide the status message after all tests complete
    cy.hideStatusMessage(statusId);
    
    // Write errors to log file if any occurred
    if (testErrors.length > 0) {
      let logContent = '=== Test Errors Log ===\n';
      logContent += `Generated at: ${new Date().toISOString()}\n`;
      logContent += `Total errors: ${testErrors.length}\n\n`;
      
      testErrors.forEach((error, index) => {
        logContent += `Error #${index + 1}:\n`;
        logContent += `  Test: ${error.test}\n`;
        logContent += `  Type: ${error.error}\n`;
        logContent += `  Message: ${error.message}\n`;
        logContent += `  Time: ${error.timestamp}\n`;
        logContent += `  Stack Trace:\n`;
        // Format stack trace with indentation for readability
        if (error.stack) {
          logContent += error.stack.split('\n').map(line => `    ${line}`).join('\n');
        } else {
          logContent += '    No stack trace available';
        }
        logContent += '\n\n';
      });
      
      // Write to file using cy.writeFile
      cy.writeFile('cypress/logs/test-errors.log', logContent, { flag: 'a+' })
        .then(() => {
          cy.log(`Error log saved with ${testErrors.length} errors`);
        });
    }
  });

  it('should create a new booking', () => {
    // Wait a moment after login to ensure the page is fully settled
    cy.wait(1000);

    // Click on the "Bookings" link in the navigation bar
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();

    // Verify we're on the booking list page
    cy.url().should('include', '/bookings/');
    cy.contains('h1', 'Bookings').should('be.visible');

    // Find and click the "New Booking" button with highlight
    cy.contains('a.btn-primary', 'New Booking').clickWithHighlight();

    // Verify we're on the booking creation page
    cy.url().should('include', '/bookings/create/');

    // Debug: Check if we're actually logged in
    cy.get('body').then(($body) => {
      if ($body.text().includes('login') || $body.text().includes('Login')) {
        cy.log('Login page detected - user not authenticated');
        cy.screenshot('login-page-detected');
      } else {
        cy.log('Not on login page - user appears authenticated');
      }
    });

    // Select customer with highlight
    cy.get('#id_customer', { timeout: 10000 }).should('be.visible').selectWithHighlight('John Doe');

    // Select court with highlight
    cy.get('#id_court').selectWithHighlight('Court 1');

    // Set start time (tomorrow at 10:00)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0);

    // Set end time (tomorrow at 11:00)
    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0);

    // Format dates for input
    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Set start time with highlight
    cy.get('#id_start_time').invoke('val', formatDateTime(tomorrow));
    cy.get('#id_start_time').should('have.value', formatDateTime(tomorrow));

    // Set end time with highlight
    cy.get('#id_end_time').invoke('val', formatDateTime(endTime));
    cy.get('#id_end_time').should('have.value', formatDateTime(endTime));

    // Set fee with highlight
    cy.get('#id_fee').typeWithHighlight('20.00', { arrowPosition: 'right' });

    // Wait before submitting
    cy.showWaitMessage('Waiting to complete the form before submitting...', 5000);

    // Submit form with highlight
    cy.get('button[type="submit"]').clickWithHighlight();

    // Verify success
    cy.url().should('include', '/bookings/');
    cy.contains('Booking created successfully!').should('be.visible');

    // Verify booking appears in list with highlight
    cy.contains('John Doe').should('be.visible');
    cy.contains('Court 1').should('be.visible');
    cy.showWaitMessage('Successfully booked!...', 5000);
  });

  it('should view booking details', () => {

    // Click on the "Bookings" link in the navigation bar
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();

    // Verify we're on the booking list page
    cy.url().should('include', '/bookings/');
    cy.contains('h1', 'Bookings').should('be.visible');

    // Verify that there is at least one booking for John Doe
    cy.contains('td', 'John Doe').should('be.visible');

    // Find the booking for John Doe and click the view button (eye icon)
    cy.contains('td', 'John Doe')
      .parent('tr') // Get the parent row
      .find('a.btn-outline-primary') // Find the view button (eye icon)
      .first() // Get the first view button in case there are multiple
      .clickWithHighlight();

    // Verify we're on the detail page
    cy.url().should('match', /\/bookings\/\d+\/$/); // URL should match /bookings/<number>/
    cy.contains('h1', 'Booking Details').should('be.visible');

    // Verify booking details are displayed
    cy.contains('td', 'John Doe').should('be.visible');
    cy.contains('td', 'Court 1').should('be.visible');

    // Highlight the back button
    cy.contains('a', 'Back to List').clickWithHighlight();

    // Verify we're back on the list page
    cy.url().should('include', '/bookings/');
    cy.contains('h1', 'Bookings').should('be.visible');
  });

  it('should process payment for a booking', () => {
    // First, create a booking with highlights
    cy.highlightNavigation('/bookings/create/');

    cy.get('#id_customer', { timeout: 10000 }).should('be.visible').selectWithHighlight('John Doe');
    cy.get('#id_court').selectWithHighlight('Court 1');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0);

    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    cy.get('#id_start_time').invoke('val', formatDateTime(tomorrow));
    cy.get('#id_end_time').invoke('val', formatDateTime(endTime));
    cy.get('#id_fee').typeWithHighlight('20.00', { arrowPosition: 'right' });

    cy.showWaitMessage('Check payment details before submitting...', 5000);
    cy.get('button[type="submit"]').clickWithHighlight();

    // Wait for booking to be created
    cy.showWaitMessage('Waiting for booking to be created...', 3000);

    // Now process payment with highlights
    cy.contains('John Doe').parent().parent().find('a').first().clickWithHighlight();
    cy.wait(2000);

    // Highlight the Process Payment button
    cy.contains('Process Payment').clickWithHighlight();

    // Fill payment form with highlights
    cy.get('#id_amount', { timeout: 10000 }).should('be.visible').clear().typeWithHighlight('20.00');
    cy.get('#id_payment_method').selectWithHighlight('cash');
    cy.get('#id_transaction_id').typeWithHighlight('TXN12345');

    // Wait before submitting
    cy.wait(3000);

    // Submit payment with highlight
    cy.get('button[type="submit"]').clickWithHighlight();

    // Verify payment was processed
    cy.contains('Payment processed successfully!').should('be.visible');
    cy.contains('paid').should('be.visible');

    // Highlight the back to booking details button
    //cy.contains('Back to Booking').clickWithHighlight();

    cy.showWaitMessage('Payment process completed!', 10000);
  });

  
  it('should edit an existing booking', () => {
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    
    // Verify we're on the booking list page
    cy.url().should('include', '/bookings/');
    cy.contains('h1', 'Bookings').should('be.visible');
    
    // Find an existing booking and click the edit button
    cy.contains('td', 'John Doe')
      .parent('tr') // Get the parent row
      .find('a[href$="/update/"]') // Find link ending with /update/
      .first() // Get the first match
      .clickWithHighlight();
    
    // Verify we're on the edit page
    cy.url().should('match', /\/bookings\/\d+\/update\/$/);
    
    // Wait for the form to load
    cy.wait(1000);
    
    // Modify the booking details
    cy.get('#id_court').selectWithHighlight('Court 2'); // Change court
    
    // Change start time to tomorrow at 14:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0);
    
    // Change end time to tomorrow at 15:30
    const endTime = new Date(tomorrow);
    endTime.setHours(15, 30);
    
    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    // Update the times with highlight
    cy.get('#id_start_time').invoke('val', formatDateTime(tomorrow));
    cy.get('#id_start_time').should('have.value', formatDateTime(tomorrow));
    
    cy.get('#id_end_time').invoke('val', formatDateTime(endTime));
    cy.get('#id_end_time').should('have.value', formatDateTime(endTime));
    
    // Update the fee with highlight
    cy.get('#id_fee').clear().typeWithHighlight('30.00', {arrowPosition: 'right'});
    
    // Wait before submitting
    cy.showWaitMessage('Reviewing changes before submitting...', 3000);
    
    // Submit the form with highlight
    cy.get('button[type="submit"]').clickWithHighlight();
    
    // Verify success
    cy.contains('Booking updated successfully!').should('be.visible');
    
    // Verify the changes were applied
    cy.contains('Court 2').should('be.visible');
    cy.contains('$30.00').should('be.visible');
    
    cy.showWaitMessage('Booking updated successfully!', 3000);
  });

  
  it('should delete an unpaid booking', () => {
    // First create a new unpaid booking
    cy.highlightNavigation('/bookings/create/');
    
    cy.get('#id_customer', { timeout: 10000 }).should('be.visible').selectWithHighlight('Jane Smith');
    cy.get('#id_court').selectWithHighlight('Court 1');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(16, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setHours(17, 0);
    
    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    cy.get('#id_start_time').invoke('val', formatDateTime(tomorrow));
    cy.get('#id_end_time').invoke('val', formatDateTime(endTime));
    cy.get('#id_fee').typeWithHighlight('25.00', {arrowPosition: 'right'});
    
    cy.showWaitMessage('Creating booking for deletion test...', 3000);
    cy.get('button[type="submit"]').clickWithHighlight();
    
    // Wait for booking to be created and verify
    cy.showWaitMessage('Waiting for booking to be created...', 2000);
    cy.contains('Booking created successfully!').should('be.visible');
    
    // Get the booking ID for verification
    let bookingId;
    cy.url().then((url) => {
      const match = url.match(/\/bookings\/(\d+)\//);
      if (match) {
        bookingId = match[1];
        cy.log(`Created booking ID: ${bookingId}`);
      }
    });
    
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.wait(1000);
    
    // Verify the booking exists in the list
    cy.contains('Jane Smith').should('be.visible');
    
    // Now delete the booking
    cy.contains('Jane Smith')
      .parent('tr') // Get the parent row
      .find('a[href$="/delete/"]') // Find link ending with /delete/
      .first() // Get the first match
      .clickWithHighlight();
    
    // Verify we're on the delete confirmation page
    cy.url().should('match', /\/bookings\/\d+\/delete\/$/);
    cy.contains('Delete Booking').should('be.visible');
    
    // Verify the booking details are shown
    cy.contains('Jane Smith').should('be.visible');
    cy.contains('Court 1').should('be.visible');
    
    // Debug: Check what buttons are available
    cy.get('body').then(($body) => {
      if ($body.find('button[type="submit"]').length > 0) {
        cy.log('Delete button found');
      } else {
        cy.log('Delete button NOT found');
        cy.screenshot('delete-button-missing');
      }
    });
    
    // Wait before confirming deletion
    cy.showWaitMessage('Confirming deletion of unpaid booking...', 3000);
    
    // Confirm deletion with highlight
    cy.get('button[type="submit"]').clickWithHighlight();
    
    // Debug: Check where we are redirected
    cy.url().then((url) => {
      cy.log(`Redirected to: ${url}`);
    });
    
    // Check for any success messages
    cy.get('body').then(($body) => {
      if ($body.text().includes('successfully')) {
        cy.log('Success message found');
      } else {
        cy.log('No success message found');
        cy.screenshot('no-success-message');
      }
    });
    
    // Verify the booking is no longer in the list
    cy.contains('Jane Smith').should('not.exist');
    
    cy.showWaitMessage('Unpaid booking deleted successfully!', 3000);
  });

  it('should not allow deletion of a paid booking', () => {
    
    // Navigate to bookings list
    cy.get('.navbar-nav .nav-link').contains('Bookings').clickWithHighlight();
    cy.wait(1000);
    
    // Verify the booking is marked as paid
    cy.contains('John Doe')
      .parent('tr') // Get the parent row
      .find('.badge.bg-success') // Find the paid badge
      .contains('paid')
      .should('be.visible');
    
    // Now try to delete the paid booking
    cy.contains('John Doe')
      .parent('tr') // Get the parent row
      .find('a[href$="/delete/"]') // Find link ending with /delete/
      .first() // Get the first match
      .clickWithHighlight();
    
    // Verify we're on the delete page but deletion is blocked
    cy.url().should('match', /\/bookings\/\d+\/delete\/$/);
    
    // Verify the warning message is shown
    cy.contains('Cannot Delete Booking').should('be.visible');
    cy.contains('This booking has been paid for and cannot be deleted.').should('be.visible');
    
    // Verify the delete button is not present
    cy.get('button[type="submit"]').should('not.exist');
    
    // Verify there's a back button
    cy.contains('Back to Booking').should('be.visible').clickWithHighlight();
    
    // Verify we're back on the booking detail page
    cy.url().should('match', /\/bookings\/\d+\/$/);
    
    cy.showWaitMessage('Verified that paid booking cannot be deleted!', 3000);
  });

  // Add more tests here...

});

