// cypress/support/commands/createBookingTestData.cy.js
export const createBookingTestData = () => {
    // Command to create test data for bookings (customers and courts)
    Cypress.Commands.add('createBookingTestData', () => {
        cy.log('Creating test data for bookings')

        // Make a request to create test customers and courts
        cy.request({
            method: 'POST',
            url: '/api/test-create-booking-data/',
            timeout: 30000,
            failOnStatusCode: false
        }).then((response) => {
            if (response.status === 200) {
                cy.log(response.body.message)
            } else {
                cy.log(`Failed to create booking test data: ${response.body.message}`)
                throw new Error(`Failed to create booking test data: ${response.body.message}`)
            }
        })
    })
};

createBookingTestData();