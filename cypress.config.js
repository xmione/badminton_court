// cypress.config.js
const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');
// ---------- Cucumber with esbuild ----------
const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor');
const { createEsbuildPlugin } = require('@badeball/cypress-cucumber-preprocessor/esbuild');
// ------------------------------------------

module.exports = defineConfig({
  projectId: 'zr2raz',
  e2e: {
    baseUrl: process.env.CYPRESS_INTERNAL_baseUrl || process.env.CYPRESS_baseUrl || "http://localhost:8000",
    supportFile: "cypress/support/e2e.js",
    // --- Include both legacy and Cucumber feature files ---
    specPattern: [
      "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
      "cypress/e2e/**/*.feature"
    ],
    // ----------------------------------------------------
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
      // --- Enable Cucumber preprocessor ---
      addCucumberPreprocessorPlugin(on, config);

      // --- esbuild for .feature files ONLY ---
      on('file:preprocessor', (file) => {
        if (file.filePath.endsWith('.feature')) {
          return createEsbuildPlugin(config)(file);
        }
        // For .cy.js, Cypress uses its own default preprocessor
      });
      // ------------------------------------

      // ------- ENVIRONMENT LOADING (Docker‑safe) -------
      // In Docker, required vars are set by docker-compose; we skip the file read.
      const needsEnvFile = !(config.env.APP_DOMAIN || process.env.APP_DOMAIN);
      if (needsEnvFile) {
        const envFile = process.env.ENVIRONMENT === 'development' ? '.env.dev' : '.env.docker';
        console.log(`Cypress: Loading env from file: ${envFile}`);
        try {
          const envPath = path.resolve(__dirname, envFile);
          if (fs.existsSync(envPath)) {
            const envVars = fs.readFileSync(envPath, 'utf8')
              .split('\n')
              .filter(line => line.trim() && !line.startsWith('#'))
              .reduce((acc, line) => {
                const [key, ...valueParts] = line.split('=');
                if (key) acc[key.trim()] = valueParts.join('=').trim();
                return acc;
              }, {});

        // console.log('Cypress: Variables read from file:', envVars);
        // Set all variables from the file into config.env
            config.env = { ...config.env, ...envVars };
            // console.log('Cypress: Final config.env object:', config.env);
          } else {
            console.warn(`Env file not found: ${envPath} – using available environment variables.`);
          }
        } catch (error) {
          console.error(`Failed to load environment file: ${envFile}`, error);
          throw new Error(`Failed to load environment variables from ${envFile}`);
        }
      } else {
        console.log('Cypress: Using environment variables from Docker (skipping file read)');
        // Ensure APP_DOMAIN ends up in config.env for tests
        config.env.APP_DOMAIN = config.env.APP_DOMAIN || process.env.APP_DOMAIN;
      }

      // Construct POSTE_API_HOST if parts are present
      if (config.env.POSTE_PROTOCOL && config.env.POSTE_HOSTNAME && config.env.POSTE_PORT) {
        config.env.POSTE_API_HOST = `${config.env.POSTE_PROTOCOL}://${config.env.POSTE_HOSTNAME}:${config.env.POSTE_PORT}`;
      }

      // baseUrl – already set from global config, but also available from env
      config.baseUrl = config.env.CYPRESS_baseUrl || config.env.CYPRESS_INTERNAL_baseUrl || config.baseUrl;

      // Validate required variable
      if (!config.env.APP_DOMAIN) {
        throw new Error('Missing required environment variable: APP_DOMAIN');
      }
      console.log(`Cypress: APP_DOMAIN = ${config.env.APP_DOMAIN}`);
      // ------ END ENVIRONMENT LOADING ------

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
        if (fs.existsSync(config.videosFolder)) {
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
        }
      });

      return config;
    },
  },
});