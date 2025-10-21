// Scripts/backupIndividual.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const imagesToBackup = [
  'badminton_court-postal:latest',
  'badminton_court-celery-beat:latest',
  'badminton_court-celery:latest',
  'badminton_court-web-dev:latest',
  'badminton_court-web-test:latest',
  'badminton_court-web:latest',
  'badminton_court-cypress:latest',
  'badminton_court-presentation:latest',
  'badminton_court-tunnel:latest',
  'badminton_court-test-setup:latest'
];

const backupDir = './backups';

function main() {
  try {
    console.log('Backing up individual Docker images...');

    // Create the backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    for (const image of imagesToBackup) {
      // Create a clean filename, e.g., 'badminton_court-postal:latest' -> 'postal-image.tar'
      const imageName = image.split(':')[0].split('-').pop(); // e.g., 'postal'
      const outputFileName = `${imageName}-image.tar`;
      const outputFilePath = path.join(backupDir, outputFileName);

      console.log(`  -> Backing up ${image} to ${outputFileName}...`);
      execSync(`docker save -o ${outputFilePath} ${image}`, { stdio: 'inherit' });
    }

    console.log('\n✅ All individual images backed up successfully!');

  } catch (error) {
    console.error('\n❌ Error: Individual backup failed.');
    console.error(error.message);
    process.exit(1);
  }
}

main();