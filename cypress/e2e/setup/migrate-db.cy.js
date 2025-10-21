// cypress/e2e/setup/migrate-db.cy.js

describe('Database Migration', { testIsolation: false }, () => {

  it('should run database migrations successfully', () => {
    cy.log('Running database migrations...');
    cy.updateStatusMessage(statusId, 'Running database migrations...', 'This may take a moment...');

    // Run Django migrations
    cy.exec('python manage.py migrate', { timeout: 60000 })
      .then((result) => {
        if (result.code !== 0) {
          cy.log(`Migration failed: ${result.stderr}`);
          throw new Error('Migration failed. Check the logs for details.');
        } else {
          cy.log('Migrations completed successfully');
          cy.updateStatusMessage(statusId, 'Migrations completed successfully.', '');
        }
      });
  });
});