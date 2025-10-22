// cypress.config.js
const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  projectId: 'zr2raz',
  e2e: {
    baseUrl: process.env.CYPRESS_INTERNAL_baseUrl || process.env.CYPRESS_baseUrl || "http://localhost:8000",
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 5000,
    requestTimeout: 5000,
    responseTimeout: 5000,

    // Video configuration
    video: true,
    videoCompression: 15, // Better quality for presentations
    // videoUploadOnPasses: true, // Removed - deprecated in Cypress 13.0.0
    videosFolder: 'cypress/videos',
    screenshotOnRunFailure: true,
    screenshotFolder: 'cypress/screenshots',
    record: false, // Disable Cypress Dashboard

    // Chrome configuration to disable sandboxing (fixes D-Bus errors)
    chromeWebSecurity: false,
    browser: "chrome",
    modifiedObstructiveThirdPartyCodeResolution: "warning",
    experimentalModifyObstructiveThirdPartyCode: true,
    experimentalSourceRewriting: false,

    setupNodeEvents(on, config) {
      // --- EXPLICIT ENVIRONMENT VARIABLE LOADING ---
      // Manually read and set environment variables from the correct .env file.
      // This is the most reliable method for Docker exec.

      const envFile = process.env.ENVIRONMENT === 'development' ? '.env.dev' : '.env.docker';
      console.log(`Cypress: Attempting to load env file: ${envFile}`);
      try {
        const envVars = fs.readFileSync(path.resolve(__dirname, envFile), 'utf8')
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .reduce((acc, line) => {
            const [key, ...valueParts] = line.split('=');
            if (key) {
              acc[key.trim()] = valueParts.join('=').trim();
            }
            return acc;
          }, {});

        // console.log('Cypress: Variables read from file:', envVars);
        // Set all variables from the file into config.env
        config.env = { ...config.env, ...envVars };
        // console.log('Cypress: Final config.env object:', config.env);
        
        // Construct POSTE_API_HOST from the individual parts, just like docker-compose.yml
        if (config.env.POSTE_PROTOCOL && config.env.POSTE_HOSTNAME && config.env.POSTE_PORT) {
          config.env.POSTE_API_HOST = `${config.env.POSTE_PROTOCOL}://${config.env.POSTE_HOSTNAME}:${config.env.POSTE_PORT}`;
        }

        // Set the baseUrl from the newly loaded variables
        config.baseUrl = config.env.CYPRESS_INTERNAL_baseUrl || config.env.CYPRESS_baseUrl || "http://localhost:8000";

      } catch (error) {
        console.error(`Could not load environment file: ${envFile}`, error);
      }
      // --- END EXPLICIT ENVIRONMENT LOADING ---

      // Ensure videos folder exists
      on('before:run', () => {
        const videosDir = path.join(config.projectRoot, 'cypress', 'videos');
        if (!fs.existsSync(videosDir)) {
          fs.mkdirSync(videosDir, { recursive: true });
        }
      });

      // Process videos after test run
      on('after:run', (results) => {
        const { exec } = require('child_process');

        // Process all videos to crop out Cypress UI
        fs.readdirSync(config.videosFolder).forEach(file => {
          if (file.endsWith('.mp4')) {
            const inputPath = path.join(config.videosFolder, file);
            const outputPath = path.join(config.videosFolder, `presentation_${file}`);

            // Use FFmpeg to crop the video (remove left sidebar)
            // Adjust the crop values based on your screen resolution
            exec(`ffmpeg -i ${inputPath} -filter:v "crop=1280:720:400:0" ${outputPath}`, (error) => {
              if (error) {
                console.error(`Error processing video ${file}:`, error);
              } else {
                console.log(`✅ Presentation video created: ${outputPath}`);
              }
            });
          }
        });
      });

      return config;
    },
  },
});