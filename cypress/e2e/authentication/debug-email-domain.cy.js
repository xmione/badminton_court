describe('Debug Email Domain Issue', () => {
  it('should check site configuration and email content', () => {
    const testEmail = Cypress.env('REGULARUSER_EMAIL');
    
    cy.log('=== Checking Site Configuration ===');
    
    // Check current site configuration via API
    cy.request({
      method: 'GET',
      url: '/api/debug-site-config/',
      failOnStatusCode: false
    }).then((response) => {
      cy.log('Site Config Response:', JSON.stringify(response.body));
    });

    // Perform signup to trigger email
    cy.log('=== Performing Signup to Trigger Email ===');
    cy.visit('/accounts/signup/');
    cy.get('#id_email').type(testEmail);
    cy.get('#id_password1').type(Cypress.env('REGULARUSER_PASSWORD'));
    cy.get('#id_password2').type(Cypress.env('REGULARUSER_PASSWORD'));
    cy.get('button[type="submit"]').click();

    // Wait for email to be "sent" and check what was generated
    cy.wait(5000);
    
    // Check what email would have been sent
    cy.request({
      method: 'POST',
      url: '/api/debug-email-content/',
      body: { email: testEmail },
      failOnStatusCode: false
    }).then((response) => {
      cy.log('Generated Email Content:', JSON.stringify(response.body));
    });
  });
});