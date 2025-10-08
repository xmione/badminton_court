// Scripts/create-presentations.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
// At the top of the script, ensure the correct environment is loaded
require('dotenv').config({ path: `.env.${process.env.ENVIRONMENT || 'dev'}` });

// When building the Cypress command, use the appropriate base URL
const baseUrl = process.env.CYPRESS_INTERNAL_baseUrl || 'http://localhost:8000';
const environment = process.env.ENVIRONMENT || 'development';
let postProcessVideos = "dev:post-process-videos";
if (environment === 'docker') {
    postProcessVideos = 'docker:post-process-videos';
}

// Try to import inquirer with different approaches
let inquirer;
try {
  // Try the newer ES modules approach
  inquirer = require('inquirer').default;
} catch (e) {
  try {
    // Try the older CommonJS approach
    inquirer = require('inquirer');
  } catch (e) {
    console.log('❌ Inquirer package not found. Installing it now...');
    try {
      execSync('npm install inquirer@^8.2.5', { stdio: 'inherit' });
      inquirer = require('inquirer');
    } catch (installError) {
      console.error('❌ Failed to install inquirer:', installError.message);
      console.log('🔄 Falling back to simple number-based selection...');
      // Fallback to simple selection
      fallbackToNumberSelection();
      return;
    }
  }
}

// Function to find all test files
function findTestFiles(dir) {
  const testFiles = [];
  
  const scanDirectory = (currentDir) => {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.endsWith('.cy.js')) {
        const relativePath = path.relative('cypress/e2e', fullPath);
        testFiles.push({
          name: file,
          value: relativePath
        });
      }
    }
  };
  
  scanDirectory(dir);
  return testFiles;
}

// Fallback function for number-based selection
function fallbackToNumberSelection() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const testFiles = findTestFiles('cypress/e2e');
  
  console.log('\n📹 Available Cypress tests for presentation video creation:\n');
  
  testFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}`);
  });
  
  console.log('\n0. Cancel\n');
  
  rl.question('Enter the number of the test you want to create a presentation video for: ', (answer) => {
    const selection = parseInt(answer);
    
    if (selection === 0) {
      console.log('❌ Operation cancelled.');
      rl.close();
      process.exit(0);
    }
    
    if (isNaN(selection) || selection < 1 || selection > testFiles.length) {
      console.log('❌ Invalid selection. Please run the script again and choose a valid number.');
      rl.close();
      process.exit(1);
    }
    
    runTestAndCreateVideo(testFiles[selection - 1].value);
    rl.close();
  });
}

// Function to run the selected test and create presentation video
function runTestAndCreateVideo(testFile) {
  console.log(`\n🎬 Creating presentation video for: ${testFile}`);
  console.log('This may take a few minutes...\n');
  
  try {
    // Run the test with video recording
    console.log('🚀 Running Cypress test...');
    execSync(`npx cypress run --headed --browser chrome --config video=true,baseUrl=${baseUrl} --spec cypress/e2e/${testFile}`, { 
      stdio: 'inherit',
      timeout: 300000 // 5 minutes timeout
    });
    
    // Post-process the video
    console.log('\n🎥 Processing video to remove Cypress UI...');
    execSync(`npm run ${postProcessVideos}`, { stdio: 'inherit' });
    
    console.log('\n✅ Presentation video created successfully!');
    console.log(`📁 Video location: cypress/presentation-videos/${path.basename(testFile, '.js')}.mp4`);
  } catch (error) {
    console.error('\n❌ Error creating presentation video:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log('🎬 Cypress Presentation Video Creator\n');
  
  const testFiles = findTestFiles('cypress/e2e');
  
  if (testFiles.length === 0) {
    console.log('❌ No test files found in cypress/e2e directory.');
    process.exit(1);
  }
  
  // If inquirer is available, use interactive selection
  if (inquirer && typeof inquirer.prompt === 'function') {
    console.log(`Found ${testFiles.length} test files. Use arrow keys to navigate, Enter to select:\n`);
    
    const questions = [
      {
        type: 'list',
        name: 'selectedTest',
        message: 'Select a test to create a presentation video:',
        choices: testFiles,
        pageSize: 10,
        loop: false
      }
    ];
    
    try {
      const answers = await inquirer.prompt(questions);
      runTestAndCreateVideo(answers.selectedTest);
    } catch (error) {
      if (error.isTtyError) {
        console.log('❌ Could not render interactive interface. Please run this script in a terminal that supports interactive prompts.');
      } else {
        console.error('❌ An error occurred:', error);
        fallbackToNumberSelection();
      }
    }
  } else {
    // Fallback to number-based selection
    fallbackToNumberSelection();
  }
}

// Run the script
main();