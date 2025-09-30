// cypress/e2e/admin/admin-login.cy.js
describe('Admin Login', () => {
  it('should successfully login to admin panel', () => {
    // Visit admin login page
    cy.visit('/admin/login/')
    
    // Fill in login form
    cy.get('#id_username').type('admin')
    cy.get('#id_password').type('password')
    cy.get('input[type="submit"]', {timeout: 5000})
    .should("be.visible")
    .click()
    
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
    cy.get('input[type="submit"]', {timeout: 5000})
    .should("be.visible")
    .click()
    cy.wait(5000);
    
    // Get the error note element and log its content
    cy.get(".errornote", {timeout: 5000})
      .should("be.visible")
      .then(($errorNote) => {
        // Get the actual text content
        const errorText = $errorNote.text();
        cy.log(`Actual error text: "${errorText}"`);
        
        // Assert the content matches the actual Django error message
        expect(errorText).to.include('Please enter the correct username and password');
        expect(errorText).to.include('staff account');
      });
    
    // Alternative simpler approach - check for the exact Django error message
    cy.get(".errornote", {timeout: 5000})
      .should("be.visible")
      .and('contain', 'Please enter the correct username and password for a staff account');
    
    cy.url().should('include', '/admin/login/')
  })
})