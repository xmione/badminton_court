// Scripts/listBackups.js

const fs = require('fs');
const path = require('path');

const backupDir = './backups';
const allInOneFile = 'all-images.tar';

function main() {
  try {
    if (!fs.existsSync(backupDir)) {
      console.log('Backup directory not found. No backups to list.');
      return;
    }

    const files = fs.readdirSync(backupDir);
    let foundAnyBackup = false;

    // Check for the all-in-one backup file
    if (files.includes(allInOneFile)) {
      console.log('Available all-in-one backup:');
      console.log(`  - ${allInOneFile}`);
      foundAnyBackup = true;
    }

    // Find and list individual image backups
    const imageBackups = files
      .filter(file => file.endsWith('-image.tar'))
      .map(file => file.replace('-image.tar', ''));

    if (imageBackups.length > 0) {
      // Add a newline for better readability if the all-in-one backup was already listed
      if (foundAnyBackup) { 
        console.log('\nAvailable individual image backups:');
      } else {
        console.log('Available individual image backups:');
      }
      imageBackups.forEach(name => console.log(`  - ${name}`));
      foundAnyBackup = true;
    }

    // If no backups of any kind were found
    if (!foundAnyBackup) {
      console.log('No backups found in ./backups');
      console.log('Hint: Run "npm run docker:backup-images" or "npm run docker:backup-individual" to create backups.');
    }

  } catch (error) {
    console.error('Error: Could not list backups.');
    console.error(error.message);
    process.exit(1);
  }
}

main();