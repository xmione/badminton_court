// Scripts/restoreImage.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  // The first argument is the image name, e.g., 'postal'
  const imageName = process.argv[2];

  if (!imageName) {
    console.error('Error: Please provide an image name to restore.');
    console.log('Usage: npm run docker:restore-image -- <imageName>');
    console.log('Example: npm run docker:restore-image -- postal');
    process.exit(1);
  }

  const backupFile = path.join('./backups', `${imageName}-image.tar`);

  try {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    console.log(`Restoring ${imageName} image...`);
    execSync(`docker load -i ${backupFile}`, { stdio: 'inherit' });
    console.log(`\n✅ ${imageName} image restored successfully!`);

  } catch (error) {
    console.error('\n❌ Error: Restore failed.');
    console.error(error.message);
    process.exit(1);
  }
}

main();