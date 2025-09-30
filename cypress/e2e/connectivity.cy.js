// cypress/e2e/connectivity.cy.js
describe('Web Service Connectivity', () => {
  it('should connect to the web service', () => {
    cy.request({
      url: '/',
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`Response status: ${response.status}`);
      cy.log(`Response headers:`, response.headers);
      cy.log(`Response body:`, response.body);
      expect(response.status).to.eq(200);
    });
  });

  it('should connect to the login page', () => {
    cy.request({
      url: '/admin/login/',
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`Response status: ${response.status}`);
      cy.log(`Response headers:`, response.headers);
      cy.log(`Response body:`, response.body);
      expect(response.status).to.eq(200);
    });
  });

  it('should visit the login page', () => {
    cy.visit('/admin/login/', {
      failOnStatusCode: false
    }).then((response) => {
      cy.log('Visit completed');
    });
  });
});