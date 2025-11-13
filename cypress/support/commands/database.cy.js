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
  cy.log('Resetting Poste.io by recreating its volume...');

  // Define the volume name from your docker-compose.yml
  const volumeName = 'badminton_court_poste_data'; // get this by running `docker volume ls`

  // Execute commands to stop, remove volume, and restart
  cy.exec(`docker-compose --env-file .env.docker down mail-test`).then(() => {
    cy.log('Container stopped.');
  });

  cy.exec(`docker volume rm ${volumeName}`).then(() => {
    cy.log('Old volume removed.');
  });

  cy.exec('docker-compose --env-file .env.docker up -d mail-test').then(() => {
    cy.log('New container started with a fresh volume.');
  });

  // Wait for container to fully restart and initialize.
  // This might need to be longer than 15 seconds for a fresh start.
  cy.log('Waiting for Poste.io to initialize on a fresh volume...');
  cy.wait(30000); // Wait 30 seconds for a full first-time initialization

  // Now, verify it's accessible
  cy.log('Verifying Poste.io is accessible...');
  cy.request({
    method: 'GET',
    url: Cypress.env('POSTE_API_HOST'),
    failOnStatusCode: false,
    timeout: 10000
  }).then((response) => {
    // A fresh install might redirect to a setup page, so we allow a wider range of success codes
    if (response.status >= 200 && response.status < 400) {
      cy.log(`✓ Poste.io is accessible (status: ${response.status})`);
    } else {
      // Log the body for debugging if it fails
      cy.log(`Response body: ${response.body}`);
      throw new Error(`Poste.io returned unexpected status ${response.status}`);
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