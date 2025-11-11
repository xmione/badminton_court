// cypress/e2e/setup/update-site-domain.cy.js

describe('Update Site Domain', { testIsolation: false }, () => {
   
  it('should update the site domain', () => {
    cy.updateSiteDomain();
  });

});