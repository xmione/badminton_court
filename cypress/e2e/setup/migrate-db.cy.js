// cypress/e2e/setup/migrate-db.cy.js

describe('Database Migration', { testIsolation: false }, () => {
  let testStatusId; // Local variable for this test

  before(() => {
    // Show initial status message for this test
    cy.showStatusMessage('Database Setup', {
      showSpinner: true,
      subText: 'Waiting for server to be ready...'
    }).then(id => {
      testStatusId = id; // Assign the ID returned by showStatusMessage
    });
  });

  it('should verify the server is running', () => {
    cy.log('Verifying server is running...');
    cy.updateStatusMessage(testStatusId, 'Verifying server is running...', 'This may take a moment...');

    // Check if the server is responding
    cy.request('http://web-dev:8000/')
      .then((response) => {
        expect(response.status).to.eq(200);
        cy.log('Server is running successfully');
        cy.updateStatusMessage(testStatusId, 'Server is ready.', '');
      });
  });

  after(() => {
    // Hide the status message after this test completes
    cy.hideStatusMessage(testStatusId);
  });
});