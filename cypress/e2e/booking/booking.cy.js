// cypress/e2e/booking/booking.cy.js

describe('Booking Management', () => {
  beforeEach(() => {
    // Clear cookies and localStorage to ensure clean state
    cy.clearCookies();
    cy.clearLocalStorage();

    // Run Django migrations to ensure tables exist
    cy.exec('python manage.py migrate', { timeout: 60000, failOnNonZeroExit: false })
      .then((result) => {
        if (result.code !== 0) {
          cy.log(`Migration failed: ${result.stderr}`);
          // Continue anyway as migrations might already be up to date
        } else {
          cy.log('Migrations completed successfully');
        }
      });

    // Reset the database
    cy.resetDatabase();

    // Create test data for bookings (customers and courts)
    cy.createBookingTestData();

    // Login as a regular user
    cy.loginAsRegularUser();
  });


  it('should create a new booking', () => {
    // Wait a moment after login to ensure the page is fully settled
    cy.wait(1000)

    // Now navigate to the booking creation page
    cy.visit('/bookings/create/')

    // Verify we're on the booking creation page
    cy.url().should('include', '/bookings/create/')

    // Debug: Check if we're actually logged in
    cy.get('body').then(($body) => {
      if ($body.text().includes('login') || $body.text().includes('Login')) {
        cy.log('Login page detected - user not authenticated')
        // Take a screenshot for debugging
        cy.screenshot('login-page-detected')
      } else {
        cy.log('Not on login page - user appears authenticated')
      }
    })

    // Select customer
    cy.get('#id_customer', { timeout: 10000 }).should('be.visible').select('John Doe')
    // Select court
    cy.get('#id_court').select('Court 1')

    // Set start time (tomorrow at 10:00)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0)

    // Set end time (tomorrow at 11:00)
    const endTime = new Date(tomorrow)
    endTime.setHours(11, 0)

    // Format dates for input
    const formatDateTime = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    cy.get('#id_start_time').invoke('val', formatDateTime(tomorrow))
    cy.get('#id_end_time').invoke('val', formatDateTime(endTime))

    // Set fee
    cy.get('#id_fee').type('20.00')

    cy.wait(5000)

    // Submit form
    cy.get('button[type="submit"]').click()

    // Verify success
    cy.url().should('include', '/bookings/')
    cy.contains('Booking created successfully!').should('be.visible')

    // Verify booking appears in list
    cy.contains('John Doe').should('be.visible')
    cy.contains('Court 1').should('be.visible')
    cy.wait(10000)
  })

  it('should view booking details', () => {
    // First, create a booking
    cy.visit('/bookings/create/')
    cy.get('#id_customer').select('John Doe')
    cy.get('#id_court').select('Court 1')

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0)

    const endTime = new Date(tomorrow)
    endTime.setHours(11, 0)

    const formatDateTime = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    cy.get('#id_start_time').invoke('val', formatDateTime(tomorrow))
    cy.get('#id_end_time').invoke('val', formatDateTime(endTime))
    cy.get('#id_fee').type('20.00')

    cy.wait(5000)
    cy.get('button[type="submit"]').click()

    // Now view the booking details
    cy.contains('John Doe').parent().parent().find('a').first().click()

    // Verify we're on the detail page
    cy.url().should('include', '/bookings/')
    cy.contains('Booking Details').should('be.visible')
    cy.contains('John Doe').should('be.visible')
    cy.contains('Court 1').should('be.visible')
    cy.wait(10000)
  })

  it('should process payment for a booking', () => {
    // First, create a booking
    cy.visit('/bookings/create/')
    cy.get('#id_customer').select('John Doe')
    cy.get('#id_court').select('Court 1')

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0)

    const endTime = new Date(tomorrow)
    endTime.setHours(11, 0)

    const formatDateTime = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    cy.get('#id_start_time').invoke('val', formatDateTime(tomorrow))
    cy.get('#id_end_time').invoke('val', formatDateTime(endTime))
    cy.get('#id_fee').type('20.00')
    
    cy.wait(5000)
    cy.get('button[type="submit"]').click()

    // Now process payment
    cy.wait(5000)
    cy.contains('John Doe').parent().parent().find('a').first().click()
    cy.wait(5000)
    cy.contains('Process Payment').click()

    // Fill payment form
    cy.get('#id_amount', { timeout: 10000 }).should('be.visible').clear().type('20.00')
    cy.get('#id_payment_method').select('cash')
    cy.get('#id_transaction_id').type('TXN12345')

    // Submit payment
    cy.wait(5000)
    cy.get('button[type="submit"]').click()

    // Verify payment was processed
    cy.contains('Payment processed successfully!').should('be.visible')
    cy.contains('paid').should('be.visible')
    cy.wait(10000)
  })
})