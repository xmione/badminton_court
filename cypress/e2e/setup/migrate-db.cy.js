// cypress/e2e/setup/migrate-db.cy.js

describe('Database Migration', { testIsolation: false }, () => {
  let testStatusId; // Local variable for this test

  before(() => {
    // Show initial status message for this test
    cy.showStatusMessage('Database Migration', {
      showSpinner: true,
      subText: 'Please be patient while migrations run...'
    }).then(id => {
      testStatusId = id; // Assign the ID returned by showStatusMessage
    });
  });

  it('should run database migrations successfully', () => {
    cy.log('Running database migrations...');
    cy.updateStatusMessage(testStatusId, 'Running database migrations...', 'This may take a moment...');

    // Run Django migrations inside the Docker container
    cy.exec('docker exec web-dev python manage.py migrate', { timeout: 60000 })
      .then((result) => {
        if (result.code !== 0) {
          cy.log(`Migration failed: ${result.stderr}`);
          throw new Error('Migration failed. Check the logs for details.');
        } else {
          cy.log('Migrations completed successfully');
          cy.updateStatusMessage(testStatusId, 'Migrations completed successfully.', '');
        }
      });
  });

  after(() => {
    // Hide the status message after this test completes
    cy.hideStatusMessage(testStatusId);
  });
});