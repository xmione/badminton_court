// cypress/e2e/headers-test.cy.js
describe('Headers Test', () => {
  it('should check headers for visit - working version', () => {
    let capturedRequest = null;
    
    // Intercept the login request - NO cy.log() inside!
    cy.intercept('GET', '/admin/login/', (req) => {
      // Store the request data, but don't use cy.log() here
      capturedRequest = {
        url: req.url,
        method: req.method,
        headers: req.headers
      };
    }).as('loginIntercept');
    
    cy.visit('/admin/login/', {
      failOnStatusCode: false
    });
    
    // Wait for the page to load
    cy.url().should('include', '/admin/login/');
    
    // Check what we captured OUTSIDE the intercept
    cy.wrap(null).then(() => {
      if (capturedRequest) {
        cy.log('✅ Successfully captured request!');
        cy.log('URL:', capturedRequest.url);
        cy.log('Method:', capturedRequest.method);
        cy.log('Headers:', capturedRequest.headers);
      } else {
        cy.log('❌ No request was captured');
        cy.log('This is normal - page loads might not be intercepted');
      }
    });
    
    // Try to get the alias
    cy.get('@loginIntercept', { timeout: 500 })
      .then((interception) => {
        if (interception) {
          cy.log('✅ Alias found:', interception.request.url);
        }
      });
  });

  it('should check headers for visit - simplest version', () => {
    let requestInfo = null;
    
    // Simple intercept without any Cypress commands inside
    cy.intercept('GET', '/admin/login/', (req) => {
      // Just store the data, no cy.log()
      requestInfo = {
        url: req.url,
        headers: req.headers
      };
    });
    
    cy.visit('/admin/login/', {
      failOnStatusCode: false
    });
    
    // Wait for page to load
    cy.url().should('include', '/admin/login/');
    
    // Check the results
    cy.wrap(null).then(() => {
      if (requestInfo) {
        cy.log('Request URL:', requestInfo.url);
        cy.log('Request headers:', requestInfo.headers);
      } else {
        cy.log('No request was intercepted');
      }
    });
  });

  it('should check headers for visit - alternative approach', () => {
    // Use a different approach - spy on network requests
    const networkRequests = [];
    
    cy.intercept('*', (req) => {
      networkRequests.push({
        url: req.url,
        method: req.method,
        headers: req.headers
      });
    });
    
    cy.visit('/admin/login/', {
      failOnStatusCode: false
    });
    
    // Wait a bit
    cy.wait(1000);
    
    // Check all requests
    cy.wrap(null).then(() => {
      cy.log('Total requests:', networkRequests.length);
      
      const loginRequest = networkRequests.find(req => 
        req.url.includes('/admin/login/')
      );
      
      if (loginRequest) {
        cy.log('Found login request!');
        cy.log('Headers:', loginRequest.headers);
      } else {
        cy.log('Login request not found');
        cy.log('All requests:', networkRequests.map(r => r.url));
      }
    });
  });
});