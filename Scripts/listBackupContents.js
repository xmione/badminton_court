// Scripts/listBackupContents.js

const fs = require('fs');
const { execSync } = require('child_process');

const backupFile = './backups/all-images.tar';

function main() {
  try {
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Error: Backup file not found at ${backupFile}`);
      console.log('Hint: Run "npm run docker:backup-images" to create it.');
      process.exit(1);
    }

    console.log(`📦 Listing contents of ${backupFile}...\n`);

    // The 'tar' command is available on Linux, macOS, and modern Windows.
    // -t: list the contents
    // -f: specify the archive file
    // We use 'inherit' to print the output directly to your console.
    execSync(`tar -tf ${backupFile}`, { stdio: 'inherit' });

  } catch (error) {
    // This will catch errors from the 'tar' command itself, e.g., if the file is corrupted.
    console.error('\n❌ Error: Failed to list backup contents.');
    console.error('The backup file might be corrupted or an invalid tar archive.');
    console.error(error.message);
    process.exit(1);
  }
}

main();