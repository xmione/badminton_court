describe('Authentication', () => {
  it('should successfully login with valid credentials', () => {
    cy.visit('/admin/login/')
    cy.get('#id_username').type('admin')
    cy.get('#id_password').type('password')
    cy.get('input[type="submit"]').click()
    
    cy.url().should('include', '/admin/')
    cy.contains('Site administration').should('be.visible')
  })
  
  it('should show error with invalid credentials', () => {
    cy.visit('/admin/login/')
    cy.get('#id_username').type('invalid')
    cy.get('#id_password').type('invalid')
    cy.get('input[type="submit"]').click()
    
    cy.contains('Please enter the correct username and password').should('be.visible')
  })
})