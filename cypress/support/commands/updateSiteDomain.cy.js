// cypress/support/commands/updateSiteDomain.cy.js

export const updateSiteDomain = () => {
    Cypress.Commands.add('updateSiteDomain', () => {
        const domainName = Cypress.env('DOMAIN_NAME');
        const siteHeader = Cypress.env('SITE_HEADER');

        cy.log(`Setting site domain to: ${domainName}`);

        // Use a simple, direct approach - update via management command before tests run
        cy.exec('python manage.py shell -c \"from django.contrib.sites.models import Site; site = Site.objects.get_or_create(id=1)[0]; site.domain = \\\"' + domainName + '\\\"; site.name = \\\"' + siteHeader + '\\\"; site.save(); print(\\\"Site domain updated to: \\\" + site.domain)\"', {
            failOnNonZeroExit: false
        }).then((result) => {
            if (result.code === 0) {
                cy.log('✅ Site domain updated successfully via management command');
            } else {
                cy.log('⚠️ Could not update site domain via management command');
                // Fallback - try the API approach
                cy.request({
                    method: 'POST',
                    url: '/api/update-site-domain/',
                    body: { 
                        domain: domainName,
                        name: siteHeader
                    },
                    failOnStatusCode: false
                });
            }
        });
    });
};

updateSiteDomain();