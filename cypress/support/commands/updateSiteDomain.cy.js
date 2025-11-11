// cypress/support/commands/updateSiteDomain.cy.js
export const updateSiteDomain = () => {
    Cypress.Commands.add('updateSiteDomain', () => {
        const domainName = Cypress.env('APP_DOMAIN');
        const port = Cypress.env('APP_PORT');
        const siteHeader = Cypress.env('SITE_HEADER');

        cy.log(`Setting site domain to: ${domainName}:${port}`);

        // Use a simple, direct approach - update via management command before tests run
        cy.exec(`python manage.py shell -c "from django.contrib.sites.models import Site; site = Site.objects.get_or_create(id=1)[0]; site.domain = '${domainName}:${port}'; site.name = '${siteHeader}'; site.save(); print('Site domain updated to: ' + site.domain)"`, {
            failOnNonZeroExit: false
        }).then((result) => {
            if (result.code === 0) {
                cy.log('✅ Site domain updated successfully via management command');
                cy.log(`Output: ${result.stdout}`);
            } else {
                cy.log('⚠️ Could not update site domain via management command');
                cy.log(`Error: ${result.stderr}`);
                
                // Fallback - try the API approach
                cy.request({
                    method: 'POST',
                    url: '/api/update-site-domain/',
                    body: { 
                        domain: domainName,
                        port: port,
                        name: siteHeader
                    },
                    failOnStatusCode: false
                }).then((response) => {
                    if (response.status === 200) {
                        cy.log('✅ Site domain updated successfully via API');
                        cy.log(`Response: ${JSON.stringify(response.body)}`);
                        
                        // Verify the update worked
                        cy.request('/debug-social/').then((debugResponse) => {
                            const siteDomain = debugResponse.body.site_info.domain;
                            const expectedDomain = `${domainName}:${port}`;
                            if (siteDomain === expectedDomain) {
                                cy.log(`✅ Verified site domain is now: ${siteDomain}`);
                            } else {
                                cy.log(`❌ Site domain verification failed. Expected: ${expectedDomain}, Got: ${siteDomain}`);
                            }
                        });
                    } else {
                        cy.log(`❌ API request failed with status: ${response.status}`);
                        cy.log(`Response: ${JSON.stringify(response.body)}`);
                    }
                });
            }
        });
    });
};

updateSiteDomain();