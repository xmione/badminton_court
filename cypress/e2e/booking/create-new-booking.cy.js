// cypress/e2e/booking/create-new-booking.cy.js

describe('Booking Management', () => {
  
  let statusId; 
  it('should create a new booking', () => {
    // Wait a moment after login to ensure the page is fully settled
    statusId = cy.showStatusMessage('Creating new booking.', {
      showSpinner: true,
      subText: 'Please wait...'
    });

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

});

