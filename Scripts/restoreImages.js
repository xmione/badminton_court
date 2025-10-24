// Scripts/restoreImages.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backupFile = './backups/all-images.tar';

function main() {
  try {
    console.log('Restoring Docker images from a single backup file...');

    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found at ${path.resolve(backupFile)}`);
    }

    console.log(`Loading images from ${backupFile}...`);
    // Use 'inherit' to show docker load output
    execSync(`docker load -i ${backupFile}`, { stdio: 'inherit' });

    console.log('\n✅ All images restored successfully!');

  } catch (error) {
    console.error('\n❌ Error: Restore failed.');
    console.error(error.message);
    process.exit(1);
  }
}

main();