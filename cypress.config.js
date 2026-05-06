// cypress.config.js
const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');

// ---------- Cucumber integration ----------
const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor');
const webpackPreprocessor = require('@cypress/webpack-preprocessor');
// ------------------------------------------

module.exports = defineConfig({
  projectId: 'zr2raz',
  e2e: {
    baseUrl: process.env.CYPRESS_INTERNAL_baseUrl || process.env.CYPRESS_baseUrl || "http://localhost:8000",
    supportFile: "cypress/support/e2e.js",
    // Both legacy .cy.js and .feature files
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
      // --- Enable Cucumber plugin (so it patches spec resolution etc.) ---
      addCucumberPreprocessorPlugin(on, config);

      // --- Webpack preprocessor with Badeball's loader for .feature files ---
      const webpackOptions = {
        module: {
          rules: [
            {
              test: /\.feature$/,
              use: [
                {
                  loader: '@badeball/cypress-cucumber-preprocessor/webpack',
                  options: config,
                },
              ],
            },
          ],
        },
        resolve: {
          fallback: {
            path: require.resolve('path-browserify'),
            // Add any other Node modules you might use in step definitions here, e.g.:
            // fs: false,
            // os: require.resolve('os-browserify'),
          },
        },
      };
      on('file:preprocessor', webpackPreprocessor({ webpackOptions }));
      // --------------------------------------------------------------------

      // ------- ENVIRONMENT LOADING (always parse file, like the old config) -------
      const envFile = process.env.ENVIRONMENT === 'development' ? '.env.dev' : '.env.docker';
      console.log(`Cypress: Loading env from file: ${envFile}`);
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
        config.env = { ...config.env, ...envVars };
      } catch (error) {
        console.error(`Failed to load environment file: ${envFile}`, error);
        throw new Error(`Failed to load environment variables from ${envFile}. Please ensure the file exists and contains the required variables.`);
      }
      // Construct POSTE_API_HOST if needed
      if (config.env.POSTE_PROTOCOL && config.env.POSTE_HOSTNAME && config.env.POSTE_PORT) {
        config.env.POSTE_API_HOST = `${config.env.POSTE_PROTOCOL}://${config.env.POSTE_HOSTNAME}:${config.env.POSTE_PORT}`;
      }
      // Set baseUrl from the clean variables
      config.baseUrl = config.env.CYPRESS_INTERNAL_baseUrl || config.env.CYPRESS_baseUrl || 'http://localhost:8000';
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
      on('after:run', () => {
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