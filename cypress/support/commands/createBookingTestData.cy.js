// cypress/support/commands/createBookingTestData.cy.js
const path = require('path');

export const createBookingTestData = () => {
    Cypress.Commands.add('createBookingTestData', () => {
        cy.log('Creating test data for bookings')

        const pythonCommand = Cypress.platform === 'win32' ? 'python' : 'python3';
        const projectRoot = path.resolve(__dirname, '..', '..', '..');

        // Determine which environment we're in
        const environment = Cypress.env('ENVIRONMENT') || 'development';
        
        cy.log(`Using environment: ${environment}`);

        // Execute Django management command with environment variables
        cy.exec(`${pythonCommand} manage.py create_test_booking_data`, {
            cwd: projectRoot,
            env: {
                // Pass the ENVIRONMENT variable so Django knows which .env file to load
                ENVIRONMENT: environment,
                
                // Also pass database credentials explicitly from Cypress env
                POSTGRES_USER: Cypress.env('POSTGRES_USER') || 'dbuser',
                POSTGRES_PASSWORD: Cypress.env('POSTGRES_PASSWORD') || 'P@ssw0rd123',
                POSTGRES_DB: Cypress.env('POSTGRES_DB') || 'badminton_court',
                POSTGRES_HOST: Cypress.env('POSTGRES_HOST') || 'localhost',
                POSTGRES_PORT: Cypress.env('POSTGRES_PORT') || '5432',
                
                // Other important variables
                PYTHONIOENCODING: 'utf-8',
                POSTE_DOMAIN: Cypress.env('POSTE_DOMAIN') || 'aeropace.com',
            },
            timeout: 30000,
            failOnNonZeroExit: false,
        }).then((result) => {
            // Log all output for debugging
            cy.log('Command exit code:', result.code)
            cy.log('Command stdout:', result.stdout)
            cy.log('Command stderr:', result.stderr)

            // Check if the command succeeded
            const successMessage = 'Successfully created test booking data'
            const commandSucceeded =
                (result.code === 0) ||
                (result.stdout && result.stdout.includes(successMessage))

            if (commandSucceeded) {
                cy.log('✓ Test booking data created successfully')
                return;
            }

            // If we get here, the command failed
            let errorMessage = `Failed to create booking test data`

            if (result.code !== undefined && result.code !== null) {
                errorMessage += ` (exit code: ${result.code})`
            } else {
                errorMessage += ' (exit code: undefined)'
            }

            if (result.stderr && result.stderr.trim()) {
                errorMessage += `: ${result.stderr}`
            } else if (result.stdout && result.stdout.trim()) {
                errorMessage += `: ${result.stdout}`
            } else {
                errorMessage += ': Command failed with no output'
            }

            cy.log(errorMessage)
            throw new Error(errorMessage)
        });
    });
};

createBookingTestData();