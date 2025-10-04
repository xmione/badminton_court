// cypress.config.js
const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  projectId: 'zr2raz',
  e2e: {
    baseUrl: "http://localhost:8000",
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 5000,
    requestTimeout: 5000,
    responseTimeout: 5000,
    
    // Force video recording for all tests
    video: true,
    videoCompression: 15, // Better quality
    videoUploadOnPasses: true,
    videosFolder: 'cypress/videos',
    screenshotOnRunFailure: true,
    screenshotFolder: 'cypress/screenshots',
    
    // Ensure videos are recorded even in CI
    record: false, // Disable Cypress Dashboard recording to avoid conflicts
    
    setupNodeEvents(on, config) {
      // Ensure videos folder exists before tests run
      on('before:run', () => {
        const videosDir = path.join(config.projectRoot, 'cypress', 'videos');
        if (!fs.existsSync(videosDir)) {
          fs.mkdirSync(videosDir, { recursive: true });
        }
      });
      
      // Log video recording events
      on('after:spec', (spec, results) => {
        if (results.video) {
          console.log(`Video recorded for: ${spec.name}`);
          console.log(`Video path: ${results.video}`);
        } else {
          console.log(`No video recorded for: ${spec.name}`);
        }
      });
      
      return config;
    },
  },
});