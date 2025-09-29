describe('Booking Creation', () => {
  beforeEach(() => {
    cy.login('admin', 'password')
    cy.visit('/bookings/create/')
  })
  
  it('should create a new booking successfully', () => {
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
  
  it('should show validation error for overlapping booking', () => {
    // Create first booking
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
    
    // Verify success
    cy.url().should('include', '/bookings/')
    cy.contains('Booking created successfully!').should('be.visible')
    
    // Try to create overlapping booking
    cy.visit('/bookings/create/')
    cy.get('#id_customer').select('Jane Smith')
    cy.get('#id_court').select('Court 1')
    
    const overlapStart = new Date(tomorrow)
    overlapStart.setHours(10, 30)
    
    const overlapEnd = new Date(tomorrow)
    overlapEnd.setHours(11, 30)
    
    cy.get('#id_start_time').invoke('val', formatDateTime(overlapStart))
    cy.get('#id_end_time').invoke('val', formatDateTime(overlapEnd))
    cy.get('#id_fee').type('20.00')
    cy.get('button[type="submit"]').click()
    
    // Should show validation error
    cy.contains('This court is already booked for the selected time period').should('be.visible')
  })
})