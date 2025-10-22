// cypress/support/commands/setupPosteio.cy.js

export const setupPosteio = () => {
    // Command to ensure Poste.io is set up and the user is logged in.
    Cypress.Commands.add('setupPosteio', () => {
        const apiHost = Cypress.env('POSTE_API_HOST');
        const adminEmail = Cypress.env('POSTE_API_USER');
        const adminPassword = Cypress.env('POSTE_API_PASSWORD');

        if (!apiHost || !adminEmail || !adminPassword) {
            throw new Error('POSTE_API_HOST, POSTE_API_USER, and POSTE_API_PASSWORD must be set in Cypress environment.');
        }

        cy.log(`Ensuring Posteio is ready at ${apiHost}`);

        // Visit the base URL.
        cy.visit(apiHost);

        // --- Smart Logic: Check the URL to determine the state ---
        cy.url().then((url) => {
            if (url.includes('/webmail/')) {
                // We are on the webmail page, which means the server is set up.
                cy.log('Poste.io is already set up. Navigating to admin login...');
                // Navigate to the admin login page and then log in.
                cy.visit(`${apiHost}/admin/login`);
                performLogin(adminEmail, adminPassword);

            } else {
                // We are NOT on the webmail page, so we must be on the setup page.
                cy.log('Poste.io is not set up. Performing first-time setup...');
                performSetup(apiHost, adminEmail, adminPassword);
            }
        });
    });

    // Helper function to perform the first-time setup
    function performSetup(apiHost, adminEmail, adminPassword) {
        const hostname = new URL(apiHost).hostname;

        cy.get('#install_hostname').clear().typeWithHighlight(hostname);
        cy.get('#install_superAdmin').clear().typeWithHighlight(adminEmail);
        cy.get('#install_superAdminPassword').clear().typeWithHighlight(adminPassword);
        cy.get('button[type="submit"]').clickWithHighlight();

        // After setup, it redirects to the webmail page. We need to go to the admin login.
        cy.url().should('include', '/webmail/');
        cy.log('Setup complete. Navigating to admin login...');
        cy.visit(`${apiHost}/admin/login`);
        performLogin(adminEmail, adminPassword);
    }

    // Helper function to perform the login
    function performLogin(adminEmail, adminPassword) {
        cy.url().should('include', '/admin/login');

        cy.get('#email').clear().type(adminEmail);
        cy.get('#password').clear().type(adminPassword);
        cy.get('button[type="submit"]').clickWithHighlight();

        // Verify successful login
        cy.url().should('not.include', '/login');
        cy.get('body').should('contain', 'Mailserver dashboard');
        cy.log('Successfully logged in to Poste.io.');
    }
};

setupPosteio();