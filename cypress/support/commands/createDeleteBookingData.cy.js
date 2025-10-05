// cypress/support/commands/createDeleteBookingData.cy.js
export const createDeleteBookingData = () => {
    // Command to create test data for bookings (customers and courts)
    Cypress.Commands.add('createDeleteBookingData', () => {
        cy.log('Creating test data for deleting a booking')

        // Execute Django management command instead of HTTP request
        cy.exec('python manage.py create_delete_booking_data', { 
            timeout: 30000, 
            failOnNonZeroExit: false 
        }).then((result) => {
            // Log all output for debugging
            cy.log('Command exit code:', result.code)
            cy.log('Command stdout:', result.stdout)
            cy.log('Command stderr:', result.stderr)
            
            // Check if the command succeeded based on output or exit code
            const successMessage = 'Successfully created test booking data'
            const commandSucceeded = 
                (result.code === 0) || 
                (result.stdout && result.stdout.includes(successMessage))
            
            if (commandSucceeded) {
                cy.log('Test booking data created successfully')
                return; // Exit successfully
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
                
                // Try to get more debugging information
                cy.log('Attempting to debug the management command...')
                cy.exec('python manage.py help', { timeout: 10000, failOnNonZeroExit: false })
                    .then((helpResult) => {
                        cy.log('Django manage.py help output:', helpResult.stdout)
                    })
                
                cy.exec('python manage.py help create_delete_booking_data', { timeout: 10000, failOnNonZeroExit: false })
                    .then((helpResult) => {
                        cy.log('Management command help output:', helpResult.stdout)
                    })
            }
            
            cy.log(errorMessage)
            throw new Error(errorMessage)
        })
    })
};

createDeleteBookingData();