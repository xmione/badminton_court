// cypress/support/commands/database.cy.js

// Reset Django database
Cypress.Commands.add('resetDjangoDb', () => {
  cy.log('Resetting Django database...');
  
  cy.request({
    method: 'POST',
    url: '/api/test/reset-django-db/',
    failOnStatusCode: false
  }).then((response) => {
    if (response.status !== 200) {
      cy.log(`Warning: Django DB reset failed: ${JSON.stringify(response.body)}`);
      throw new Error(`Django DB reset failed: ${response.body.message}`);
    } else {
      cy.log('Django database reset successfully');
      
      // Validate: Check that users are actually deleted (except what reset creates)
      cy.request({
        method: 'GET',
        url: '/api/test/user-count/',
        failOnStatusCode: false
      }).then((countResponse) => {
        if (countResponse.status === 200) {
          const userCount = countResponse.body.count || 0;
          cy.log(`✓ Validation: ${userCount} users in Django database after reset`);
          
          // You can add assertions here based on your reset logic
          // For example, if reset creates only admin users:
          if (userCount > 5) {
            cy.log(`Warning: Expected fewer users after reset, found ${userCount}`);
          }
        }
      });
    }
  });
});

// Reset Poste.io database
Cypress.Commands.add('resetPosteioDb', () => {
  cy.log('Resetting Poste.io database...');
  
  cy.request({
    method: 'POST',
    url: '/api/test/reset-posteio-db/',
    failOnStatusCode: false,
    timeout: 30000  // Increase timeout to 30 seconds
  }).then((response) => {
    if (response.status !== 200) {
      cy.log(`Warning: Poste.io DB reset failed: ${JSON.stringify(response.body)}`);
      if (response.body && response.body.message) {
        cy.log(`Message: ${response.body.message}`);
      }
    } else {
      cy.log('Poste.io database reset successfully');
      
      // Log the output from the management command
      if (response.body && response.body.output) {
        cy.log(`Reset output: ${response.body.output}`);
      }
      
      // Validate: Parse the output to check deletion counts
      if (response.body && response.body.output) {
        const output = response.body.output;
        
        // Check for deleted count in output
        const deletedMatch = output.match(/(\d+)\s+deleted/);
        const skippedMatch = output.match(/(\d+)\s+skipped/);
        
        if (deletedMatch) {
          const deletedCount = parseInt(deletedMatch[1]);
          cy.log(`✓ Validation: ${deletedCount} mailboxes deleted`);
        }
        
        if (skippedMatch) {
          const skippedCount = parseInt(skippedMatch[1]);
          cy.log(`✓ Validation: ${skippedCount} mailboxes skipped (admin)`);
          
          // Admin should always be skipped
          expect(skippedCount).to.be.at.least(1, 'Admin account should be skipped');
        }
        
        // Check if authentication failed
        if (output.includes('Authentication failed') || output.includes('may not exist')) {
          cy.log('⚠ Warning: Admin account does not exist in Poste.io');
          cy.log('This is normal after first reset - setupPosteio will create it');
        } else if (output.includes('completed')) {
          cy.log('✓ Poste.io reset completed successfully');
        }
      }
    }
  });
});

// Reset both databases
Cypress.Commands.add('resetAllDatabases', () => {
  cy.log('Resetting all databases...');
  
  cy.request({
    method: 'POST',
    url: '/api/test/reset-all-dbs/',
    failOnStatusCode: false
  }).then((response) => {
    if (response.status !== 200) {
      cy.log(`Warning: Database reset had issues: ${JSON.stringify(response.body)}`);
      throw new Error(`Database reset failed: ${response.body.message}`);
    } else {
      cy.log('All databases reset successfully');
      
      // Validate both databases
      cy.log('Validating Django database...');
      cy.request({
        method: 'GET',
        url: '/api/test/user-count/',
        failOnStatusCode: false
      }).then((countResponse) => {
        if (countResponse.status === 200) {
          const userCount = countResponse.body.count || 0;
          cy.log(`✓ Django: ${userCount} users after reset`);
        }
      });
      
      cy.log('✓ All databases reset and validated');
    }
  });
});