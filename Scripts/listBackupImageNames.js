// Scripts/listBackupImageNames.js

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

    console.log(`🏷️  Listing image names from ${backupFile}...\n`);

    // This command extracts and prints the 'manifest.json' file content to stdout
    // -x: extract
    // -O: write to stdout
    // -f: specify archive file
    const manifestJson = execSync(`tar -xOf ${backupFile} manifest.json`, { encoding: 'utf8' });
    const manifest = JSON.parse(manifestJson);

    if (manifest.length === 0) {
      console.log('No images found in the backup manifest.');
      return;
    }

    console.log('Images included in this backup:');
    manifest.forEach(item => {
      // RepoTags is an array like ["badminton_court-web-dev:latest"]
      if (item.RepoTags && item.RepoTags.length > 0) {
        item.RepoTags.forEach(tag => console.log(`  - ${tag}`));
      }
    });

  } catch (error) {
    console.error('\n❌ Error: Failed to read image names from the backup.');
    console.error('The backup file might be corrupted or missing a manifest.json file.');
    console.error(error.message);
    process.exit(1);
  }
}

main();