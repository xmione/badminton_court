describe('Booking Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/admin/login/')
    cy.get('#id_username').type('admin')
    cy.get('#id_password').type('password')
    cy.get('input[type="submit"]', {timeout: 5000}).should("be.visible").click()
    cy.url().should('include', '/admin/')
  })

  it('should create a new booking', () => {
    // Navigate to booking creation page
    cy.visit('/bookings/create/')

    // Select customer
    cy.get('#id_customer').select('John Doe')

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

    // Submit form
    cy.get('button[type="submit"]').click()

    // Verify success
    cy.url().should('include', '/bookings/')
    cy.contains('Booking created successfully!').should('be.visible')

    // Verify booking appears in list
    cy.contains('John Doe').should('be.visible')
    cy.contains('Court 1').should('be.visible')
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
    cy.pause()
    cy.get('button[type="submit"]', {timeout: 5000})
    .should("be.visible")
    .should("be.enabled")
    .click()
    cy.wait(5000)

    // Now view the booking details
    cy.contains('John Doe').parent().parent().find('a').first().click()

    // Verify we're on the detail page
    cy.url().should('include', '/bookings/')
    cy.contains('Booking Details').should('be.visible')
    cy.contains('John Doe').should('be.visible')
    cy.contains('Court 1').should('be.visible')
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
    cy.get('button[type="submit"]').click()

    // Now process payment
    cy.contains('John Doe').parent().parent().find('a').first().click()
    cy.contains('Process Payment').click()

    // Debug the payment page - ALL inside one .then() callback
    cy.get('body').then($body => {
      cy.log('=== DEBUG: Checking page content ===');
      cy.log('Page contains:', $body.text());
      cy.log('Current URL:', cy.url());
      cy.log('Page title:', cy.title());
      cy.log('Page HTML:', $body.html());

      // Look for any amount-related elements
      const amountElements = $body.find('[id*="amount"], [name*="amount"], [class*="amount"], input[type="number"]');
      cy.log('Found amount-related elements:', amountElements.length);

      if (amountElements.length > 0) {
        amountElements.each((index, element) => {
          cy.log(`Amount element ${index}:`, element.outerHTML);
        });
      }

      // Look for any form elements
      const formElements = $body.find('form input, form select, form textarea');
      cy.log('Found form elements:', formElements.length);

      if (formElements.length > 0) {
        formElements.each((index, element) => {
          cy.log(`Form element ${index}:`, element.outerHTML);
        });
      }
    });

    // Take a screenshot for manual inspection
    cy.screenshot('payment-page-debug');

    // Fill payment form
    cy.get('#id_amount', { timeout: 10000 }).should('be.visible').clear().type('20.00')
    cy.get('#id_payment_method').select('cash')
    cy.get('#id_transaction_id').type('TXN12345')

    // Submit payment
    cy.get('button[type="submit"]', {timeout: 5000}).should("be.visible").click()

    // Verify payment was processed
    cy.contains('Payment processed successfully!').should('be.visible')
    cy.contains('Paid').should('be.visible')
  })
})