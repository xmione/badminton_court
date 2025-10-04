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
    
    // Video configuration
    video: true,
    videoCompression: 15, // Better quality for presentations
    videoUploadOnPasses: true,
    videosFolder: 'cypress/videos',
    screenshotOnRunFailure: true,
    screenshotFolder: 'cypress/screenshots',
    record: false, // Disable Cypress Dashboard
    
    setupNodeEvents(on, config) {
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