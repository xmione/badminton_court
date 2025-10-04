// cypress/e2e/booking/booking.cy.js

describe('Booking Management', () => {
  beforeEach(() => {

     // Show a status message and get its ID
    const statusId = cy.showStatusMessage('Clearing cookies and localStorage to ensureclean state...', {
      showSpinner: true,
      subText: 'This may take a moment...'
    });
    
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
    cy.updateStatusMessage(statusId, 'Initializing database...', 'Please be patient...');
    cy.resetDatabase();

    // Create test data for bookings (customers and courts)
    cy.updateStatusMessage(statusId, 'Creating test data for Bookings...', 'Please be patient...');
    cy.createBookingTestData();

    // Login as a regular user
    cy.updateStatusMessage(statusId, 'Logging in as a Regular user...', 'Please be patient...');
    cy.loginAsRegularUser();


    // Hide the message
    cy.hideStatusMessage(statusId);
  });

  it('should create a new booking', () => {
    // Wait a moment after login to ensure the page is fully settled
    cy.wait(1000);

    // Navigate to the booking creation page with highlight
    cy.highlightNavigation('/bookings/create/');

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
    cy.get('#id_fee').typeWithHighlight('20.00');

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
    cy.get('#id_fee').typeWithHighlight('20.00');

    cy.showWaitMessage('Submitting...', 3000);
    cy.get('button[type="submit"]').clickWithHighlight();

    // Wait for success message
    cy.showWaitMessage('Waiting for success message...', 3000);

    // Now view the booking details with highlight
    cy.contains('John Doe').parent().parent().find('a').first().clickWithHighlight();

    // Verify we're on the detail page
    cy.url().should('include', '/bookings/');
    cy.contains('Booking Details').should('be.visible');
    cy.contains('John Doe').should('be.visible');
    cy.contains('Court 1').should('be.visible');
    
    // Highlight the back button
    cy.contains('Back to List').clickWithHighlight();
    
    cy.showWaitMessage('Waiting to process payment for the booking...', 3000);
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
    cy.get('#id_fee').typeWithHighlight('20.00');
    
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
});