// cypress/e2e/authentication/auth-flow.cy.js
describe('Authentication Flow', () => {
  it('should successfully register a new user', () => {
    // Visit signup page
    cy.visit('/accounts/signup/')
    
    // Fill in registration form with a unique email
    const timestamp = Date.now()
    const uniqueEmail = `testuser${timestamp}@example.com`
    
    cy.get('#id_email').type(uniqueEmail)
    cy.get('#id_password1').type('StrongPassword123!')
    cy.get('#id_password2').type('StrongPassword123!')
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Verify successful registration
    // Should either redirect to login page or show a success message
    cy.url().should('include', '/accounts/login/')
      .or(() => cy.contains('Thank you for signing up').should('be.visible'))
  })

  it('should successfully login with registered user', () => {
    // First, create a user
    const timestamp = Date.now()
    const uniqueEmail = `loginuser${timestamp}@example.com`
    
    // Register the user first
    cy.visit('/accounts/signup/')
    cy.get('#id_email').type(uniqueEmail)
    cy.get('#id_password1').type('StrongPassword123!')
    cy.get('#id_password2').type('StrongPassword123!')
    cy.get('button[type="submit"]').click()
    
    // Now login with the registered user
    cy.visit('/accounts/login/')
    cy.get('#id_login').type(uniqueEmail)
    cy.get('#id_password').type('StrongPassword123!')
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Verify successful login
    cy.url().should('not.include', '/accounts/login/')
    cy.get('nav').should('contain', 'Logout') // Check if logout link is visible
  })

  it('should show error for invalid login credentials', () => {
    // Visit login page
    cy.visit('/accounts/login/')
    
    // Fill in invalid credentials
    cy.get('#id_login').type('invalid@example.com')
    cy.get('#id_password').type('wrongpassword')
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Verify error message
    cy.contains('The e-mail address and/or password are incorrect').should('be.visible')
  })

  it('should show error for duplicate email during registration', () => {
    // Create a user first
    const timestamp = Date.now()
    const uniqueEmail = `duplicateuser${timestamp}@example.com`
    
    cy.visit('/accounts/signup/')
    cy.get('#id_email').type(uniqueEmail)
    cy.get('#id_password1').type('StrongPassword123!')
    cy.get('#id_password2').type('StrongPassword123!')
    cy.get('button[type="submit"]').click()
    
    // Try to register with the same email again
    cy.visit('/accounts/signup/')
    cy.get('#id_email').type(uniqueEmail)
    cy.get('#id_password1').type('StrongPassword123!')
    cy.get('#id_password2').type('StrongPassword123!')
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Verify error message
    cy.contains('A user is already registered with this e-mail address').should('be.visible')
  })

  it('should show error for mismatched passwords during registration', () => {
    // Visit signup page
    cy.visit('/accounts/signup/')
    
    // Fill in registration form with mismatched passwords
    const timestamp = Date.now()
    const uniqueEmail = `mismatchuser${timestamp}@example.com`
    
    cy.get('#id_email').type(uniqueEmail)
    cy.get('#id_password1').type('StrongPassword123!')
    cy.get('#id_password2').type('DifferentPassword123!')
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Verify error message
    cy.contains('The two password fields didn').should('be.visible')
  })
})