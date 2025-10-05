// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

let statusId; // Declare the variable to hold the status ID
let testErrors = []; // Array to collect errors

before(() => {
  // Show initial status message before any tests run
  cy.showStatusMessage('Aeropace Badminton Court Management System', {
    showSpinner: true,
    subText: 'Please be patient while the system loads the tests...'
  }).then(id => {
    statusId = id; // Assign the ID returned by showStatusMessage
  });

  cy.wait(10000);
  // Chaining the commands ensures proper sequence and visual updates
  cy.then(() => {
    cy.updateStatusMessage(statusId, 'Clearing cookies and localStorage to ensure clean state...', 'This may take a moment...');
  })
    .wait(1000) // Add a small wait to allow DOM to render the update
    .then(() => {
      // Clear cookies and localStorage to ensure clean state
      cy.clearCookies();
      cy.clearLocalStorage();
    })
    .then(() => {
      cy.updateStatusMessage(statusId, 'Initializing database...', 'Please be patient...');
    })
    .wait(1000) // Add a small wait
    .then(() => {
      // Run Django migrations to ensure tables exist
      cy.exec('python manage.py migrate', { timeout: 60000, failOnNonZeroExit: false })
        .then((result) => {
          if (result.code !== 0) {
            cy.log(`Migration failed: ${result.stderr}`);
          } else {
            cy.log('Migrations completed successfully');
          }
        });
    
    });


  // Set up error collection with stack trace
  Cypress.on('fail', (error, runnable) => {
    // Collect error details including stack trace
    testErrors.push({
      test: runnable.title,
      error: error.name,
      message: error.message,
      stack: error.stack, // Add stack trace
      timestamp: new Date().toISOString()
    });

    // Re-throw the error to fail the test
    throw error;
  });
});

after(() => {
  // Hide the status message after all tests complete
  cy.hideStatusMessage(statusId);

  // Write errors to log file if any occurred
  if (testErrors.length > 0) {
    let logContent = '=== Test Errors Log ===\n';
    logContent += `Generated at: ${new Date().toISOString()}\n`;
    logContent += `Total errors: ${testErrors.length}\n\n`;

    testErrors.forEach((error, index) => {
      logContent += `Error #${index + 1}:\n`;
      logContent += `  Test: ${error.test}\n`;
      logContent += `  Type: ${error.error}\n`;
      logContent += `  Message: ${error.message}\n`;
      logContent += `  Time: ${error.timestamp}\n`;
      logContent += `  Stack Trace:\n`;
      // Format stack trace with indentation for readability
      if (error.stack) {
        logContent += error.stack.split('\n').map(line => `    ${line}`).join('\n');
      } else {
        logContent += '    No stack trace available';
      }
      logContent += '\n\n';
    });

    // Write to file using cy.writeFile
    cy.writeFile('cypress/logs/test-errors.log', logContent, { flag: 'a+' })
      .then(() => {
        cy.log(`Error log saved with ${testErrors.length} errors`);
      });
  }
});