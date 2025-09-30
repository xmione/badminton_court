// cypress/e2e/admin/admin-login.cy.js
describe('Admin Login', () => {
  it('should successfully login to admin panel', () => {
    // Visit admin login page
    cy.visit('/admin/login/')
    
    // Fill in login form
    cy.get('#id_username').type('admin')
    cy.get('#id_password').type('password')
    cy.get('input[type="submit"]').click()
    
    // Verify successful login
    cy.url().should('include', '/admin/')
    cy.contains('Site administration').should('be.visible')
    cy.contains('Welcome, admin').should('be.visible')
  })

  it('should show error for invalid credentials', () => {
    // Visit admin login page
    cy.visit('/admin/login/')
    
    // Fill in invalid credentials
    cy.get('#id_username').type('invalid_user')
    cy.get('#id_password').type('wrong_password')
    cy.get('input[type="submit"]').click()
    
    // Verify error message
    cy.contains('Please enter a correct username and password').should('be.visible')
    cy.url().should('include', '/admin/login/')
  })
})