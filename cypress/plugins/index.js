module.exports = (on, config) => {
  on('task', {
    getCsrfToken() {
      return cy.request('/admin/login/')
        .its('body')
        .then((body) => {
          const $ = Cypress.$;
          const csrfToken = $('input[name="csrfmiddlewaretoken"]').val();
          return csrfToken;
        });
    }
  });
  
  return config;
}