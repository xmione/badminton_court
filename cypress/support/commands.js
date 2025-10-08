// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import './commands/loginToAdminPage.cy.js'
import './commands/loginToAdminPageWithInvalidCredentials.cy.js'
import './commands/signUp.cy.js'
import './commands/signUpDuplicateEmails.cy.js'
import './commands/signUpMismatchedPasswords.cy.js'
import './commands/loginAsRegistered.cy.js'
import './commands/loginAsInvalidCredentials.js'
import './commands/login.cy.js'
import './commands/loginAsRegularUser.cy.js'
import './commands/logout.cy.js'
import './commands/resetDatabase.cy.js'
import './commands/createVerifiedUser.cy.js'
import './commands/verifyUser.cy.js'
import './commands/setupTestAdmin.cy.js'
import './commands/adminLogin.cy.js'
import './commands/createAdminUser.cy.js'
import './commands/createBookingTestData.cy.js'
import './commands/createDeleteBookingData.cy.js'
import './commands/highlightWithArrow.cy.js'
import './commands/clickWithHighlight.cy.js'
import './commands/typeWithHighlight.cy.js'
import './commands/selectWithHighlight.cy.js'
import './commands/highlightNavigation.cy.js'
import './commands/showWaitMessage.cy.js'
import './commands/hideStatusMessage.cy.js'
import './commands/showStatusMessage.cy.js'
import './commands/updateStatusMessage.cy.js'

import './commands/createNewBooking.cy.js'
import './commands/viewBookingDetails.cy.js'
import './commands/processPayment.cy.js'
import './commands/editBooking.cy.js'
import './commands/deleteBooking.cy.js'
import './commands/deletePaidBooking.cy.js'