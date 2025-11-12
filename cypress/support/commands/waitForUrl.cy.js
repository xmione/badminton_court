// cypress/support/commands/waitForUrl.cy.js

export const waitForUrl = () => {
    /**
 * Waits for a URL to become accessible, retrying on network failures or specific status codes.
 * @param {string} url - The URL to check.
 * @param {object} [options={}] - Configuration options.
 * @param {number} [options.timeout=60000] - Total time to keep trying before failing.
 * @param {number} [options.requestTimeout=10000] - Timeout for each individual request.
 * @param {number} [options.retryDelay=5000] - How long to wait between retries.
 * @param {number[]} [options.successStatusCodes=[200, 201, 202, 204]] - Status codes that indicate success.
 */
    Cypress.Commands.add('waitForUrl', (url, options = {}) => {
        const {
            timeout = 60000,
            requestTimeout = 10000,
            retryDelay = 5000,
            successStatusCodes = [200, 201, 202, 204],
        } = options;

        const startTime = Date.now();
        let attempts = 0;

        const check = () => {
            attempts++;
            cy.log(`Checking URL (attempt ${attempts})...`);

            cy.request({
                method: 'GET',
                url: url,
                failOnStatusCode: false,
                timeout: requestTimeout,
            }).then(
                (response) => {
                    if (successStatusCodes.includes(response.status)) {
                        cy.log(`✓ URL is accessible (status: ${response.status})`);
                        return;
                    }
                    if (Date.now() - startTime > timeout) {
                        throw new Error(`URL did not become accessible within ${timeout}ms. Last status: ${response.status}`);
                    }
                    cy.log(`URL responded with ${response.status}. Retrying in ${retryDelay}ms...`);
                    cy.wait(retryDelay).then(check);
                },
                (error) => {
                    if (Date.now() - startTime > timeout) {
                        throw new Error(`URL did not become accessible within ${timeout}ms. Last error: ${error.message}`);
                    }
                    cy.log(`Connection failed. Retrying in ${retryDelay}ms...`);
                    cy.wait(retryDelay).then(check);
                }
            );
        };

        check();
    });
};

waitForUrl();