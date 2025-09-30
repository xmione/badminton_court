// cypress/e2e/headers-test.cy.js
describe('Headers Test', () => {
  it('should check headers for request', () => {
    cy.intercept('GET', '/admin/login/', (req) => {
      req.headers['Custom-Header'] = 'test-value';
    }).as('loginRequest');

    cy.request({
      url: '/admin/login/',
      failOnStatusCode: false
    });

    cy.wait('@loginRequest').then((interception) => {
      cy.log('Request headers:', interception.request.headers);
    });
  });

  it('should check headers for visit', () => {
    cy.intercept('GET', '/admin/login/', (req) => {
      req.headers['Custom-Header'] = 'test-value';
    }).as('loginVisit');

    cy.visit('/admin/login/', {
      failOnStatusCode: false
    });

    cy.wait('@loginVisit').then((interception) => {
      cy.log('Visit headers:', interception.request.headers);
    });
  });
});