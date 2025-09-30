// cypress/e2e/debug/payment-debug.cy.js
describe('Payment Page Debug', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/admin/login/')
    cy.get('#id_username').type('admin')
    cy.get('#id_password').type('password')
    cy.get('input[type="submit"]').click()
    cy.url().should('include', '/admin/')
  })

  it('should debug payment page elements', () => {
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
    
    // Wait for success message
    cy.contains('Booking created successfully!').should('be.visible')
    
    // Click on the booking to view details
    cy.contains('John Doe').parent().parent().find('a').first().click()
    
    // Take screenshot of booking detail page
    cy.screenshot('booking-detail-page-debug');
    
    // Look for ANY clickable elements on the booking detail page
    cy.get('a, button').each(($el, index) => {
      const text = $el.text().trim();
      if (text) {
        cy.log(`Clickable element ${index}: "${text}"`);
      }
    });
    
    // Try to click on anything that might be payment-related
    cy.get('body').then($body => {
      if ($body.find('a:contains("Payment")').length > 0) {
        cy.contains('Payment').click();
      } else if ($body.find('button:contains("Payment")').length > 0) {
        cy.contains('Payment').click();
      } else if ($body.find('a:contains("Pay")').length > 0) {
        cy.contains('Pay').click();
      } else if ($body.find('button:contains("Pay")').length > 0) {
        cy.contains('Pay').click();
      } else {
        cy.log('No payment-related buttons found, clicking first link');
        cy.get('a').first().click();
      }
    });
    
    // Wait for navigation
    cy.wait(2000);
    
    // Show what's on the current page
    cy.log('Current URL:', cy.url());
    cy.log('Page title:', cy.title());
    
    // Take screenshot of whatever page we're on
    cy.screenshot('after-click-debug');
    
    // Show ALL elements on the page
    cy.get('*').each(($el, index) => {
      const tagName = $el.prop('tagName').toLowerCase();
      const text = $el.text().trim();
      const id = $el.attr('id') || '';
      const className = $el.attr('class') || '';
      
      if (text || id || className) {
        cy.log(`Element ${index}: <${tagName}> id="${id}" class="${className}" text="${text.substring(0, 50)}"`);
      }
    });
    
    // Wait for manual inspection
    cy.wait(10000);
  })
})