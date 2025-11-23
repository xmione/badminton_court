// cypress/support/commands/createDeleteBookingData.cy.js

export const createDeleteBookingData = () => {
  Cypress.Commands.add('createDeleteBookingData', () => {
    cy.log('Creating test data for deleting a booking');
    
    // Execute the management command with the correct environment variables
    cy.exec('python manage.py create_delete_booking_data', {
      env: {
        // Pass the database URL from your Cypress environment
        DATABASE_URL: Cypress.env('DATABASE_URL'),
        // Also pass individual variables in case they are needed
        POSTGRES_USER: Cypress.env('POSTGRES_USER'),
        POSTGRES_PASSWORD: Cypress.env('POSTGRES_PASSWORD'),
        POSTGRES_HOST: Cypress.env('POSTGRES_HOST'),
        POSTGRES_DB: Cypress.env('POSTGRES_DB'),
        POSTGRES_PORT: Cypress.env('POSTGRES_PORT'),
      },
      failOnNonZeroExit: false // Don't fail the test on non-zero exit
    }).then((result) => {
      if (result.code !== 0) {
        const errorMessage = `Failed to create booking test data: ${result.stderr}`;
        cy.log(errorMessage);
        // We don't throw an error here, but we log it for debugging
        // This allows the test to continue and potentially fail on a more specific assertion
      } else {
        cy.log('Booking test data created successfully');
      }
    });
  });
};

createDeleteBookingData();