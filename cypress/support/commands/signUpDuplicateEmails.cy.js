// cypress/support/commands/signUpDuplicateEmailsDupliateEmails.cy.js

export const signUpDuplicateEmails = () => {
    Cypress.Commands.add('signUpDuplicateEmails', (options = {}) => {
        // Use a fresh email for first registration
        const freshEmail = Cypress.env('REGULARUSER_EMAIL');
        const password = Cypress.env('REGULARUSER_PASSWORD');

        // First registration with fresh email
        cy.visit('/accounts/signup/');
        cy.get('#id_email').type(freshEmail);
        cy.get('#id_password1').type(password);
        cy.get('#id_password2').type(password);
        cy.get('button[type="submit"]').click();

        // Wait and check everything
        cy.wait(2000);
        
        cy.url().then((url) => {
            cy.log(`Current URL: ${url}`);
        });
        
        cy.get('body').then(($body) => {
            cy.log('Full page content:', $body.text());
            cy.log('Page title:', $body.find('title').text());
            cy.log('H1 content:', $body.find('h1').text());
        });

        // Check for any form elements or messages
        // cy.get('form').then(($form) => {
        //     if ($form.length > 0) {
        //         cy.log('Form action:', $form.attr('action'));
        //     }
        // });
    });
};

signUpDuplicateEmails();