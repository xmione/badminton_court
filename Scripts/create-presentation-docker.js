// scripts/create-presentation-docker.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Function to run the selected test and create presentation video
function runTestAndCreateVideo(testFile) {
  console.log(`\n🎬 Creating presentation video for: ${testFile}`);
  console.log('This may take a few minutes...\n');
  
  try {
    // Run the test with video recording
    console.log('🚀 Running Cypress test...');
    execSync(`npx cypress run --headed --browser chrome --config video=true --spec cypress/e2e/${testFile}`, { 
      stdio: 'inherit',
      timeout: 300000 // 5 minutes timeout
    });
    
    // Post-process the video
    console.log('\n🎥 Processing video to remove Cypress UI...');
    execSync('node scripts/post-process-videos.js', { stdio: 'inherit' });
    
    console.log('\n✅ Presentation video created successfully!');
    console.log(`📁 Video location: cypress/presentation-videos/${path.basename(testFile, '.js')}.mp4`);
  } catch (error) {
    console.error('\n❌ Error creating presentation video:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log('🎬 Docker Cypress Presentation Video Creator\n');
  
  const testFiles = findTestFiles('cypress/e2e');
  
  if (testFiles.length === 0) {
    console.log('❌ No test files found in cypress/e2e directory.');
    process.exit(1);
  }
  
  // In Docker, we'll just run the first test file
  // You can modify this to accept a parameter for specific test selection
  if (process.argv.length > 2) {
    const testFileArg = process.argv[2];
    const selectedTest = testFiles.find(file => file.value === testFileArg);
    
    if (selectedTest) {
      runTestAndCreateVideo(selectedTest.value);
    } else {
      console.log(`❌ Test file not found: ${testFileArg}`);
      console.log('Available test files:');
      testFiles.forEach(file => {
        console.log(`  - ${file.value}`);
      });
      process.exit(1);
    }
  } else {
    // If no specific test file is provided, use the first one
    console.log(`No specific test file provided. Using: ${testFiles[0].value}`);
    runTestAndCreateVideo(testFiles[0].value);
  }
}

// Run the script
main();