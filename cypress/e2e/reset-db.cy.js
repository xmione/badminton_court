// cypress/e2e/reset-db.cy.js
// isolation: true by default clears browser state. You need to login for each spec.
describe('Reset Database', { testIsolation: false }, () => {

  let statusId;
  it('should successfully reset the database', () => {
    cy.log('Starting reset-db.cy.js before()');
    cy.updateStatusMessage(statusId, 'Resetting database...', 'This may take a moment...');
    
    cy.resetDatabase().then(() => {
        cy.updateStatusMessage(statusId, 'Database reset successfully.', '');
    });
    cy.log('Finished reset-db.cy.js before()');
  })
});

