// cypress/support/commands/updateSiteDomain.cy.js

export const updateSiteDomain = () => {
    Cypress.Commands.add('updateSiteDomain', () => {
        const domainName = Cypress.env('DOMAIN_NAME');
        const siteHeader = Cypress.env('SITE_HEADER');

        cy.log(`Updating site domain to: ${domainName}`);
        cy.log(`Updating site name to: ${siteHeader}`);

        // Call API to update the site domain
        cy.request({
            method: 'POST',
            url: '/api/update-site-domain/',
            body: { 
                domain: domainName,
                name: siteHeader
            },
            failOnStatusCode: false
        }).then((response) => {
            cy.log('Update Site Domain Response Status:', response.status);
            cy.log('Update Site Domain Response:', JSON.stringify(response.body));
            
            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('message');
            expect(response.body.message).to.include('successfully updated');
            
            cy.log(`✅ Site domain updated to: ${domainName}`);
        });
    });
};

updateSiteDomain();