// Scripts/listBackups.js

const fs = require('fs');
const path = require('path');

const backupDir = './backups';

function main() {
  try {
    if (!fs.existsSync(backupDir)) {
      console.log('Backup directory not found. No backups to list.');
      return;
    }

    const files = fs.readdirSync(backupDir);
    const imageBackups = files
      .filter(file => file.endsWith('-image.tar'))
      .map(file => file.replace('-image.tar', ''));

    if (imageBackups.length === 0) {
      console.log('No individual image backups found in ./backups');
    } else {
      console.log('Available image backups:');
      imageBackups.forEach(name => console.log(`  - ${name}`));
    }

  } catch (error) {
    console.error('Error: Could not list backups.');
    console.error(error.message);
    process.exit(1);
  }
}

main();