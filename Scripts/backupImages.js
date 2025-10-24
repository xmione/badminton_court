// Scripts/backupImages.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// List of all desired images based on your docker-compose.yml services
const desiredImages = [
  'badminton_court-web-dev:latest',
  'badminton_court-web-test:latest',
  'badminton_court-celery:latest',
  'badminton_court-celery-beat:latest',
  'badminton_court-tunnel:latest',
  'badminton_court-cypress:latest',
  'badminton_court-presentation:latest',
  'badminton_court-test-setup:latest',
  'redis:7-alpine',
  'postgres:14',
  'analogic/poste.io:latest'
];

const backupDir = './backups';
const outputFile = path.join(backupDir, 'all-images.tar');

function main() {
  try {
    console.log('🔍 Checking for available Docker images to back up...');

    // Get a clean list of all images available on the local machine
    // The '--format' flag gives us a clean "name:tag" output for each image
    const availableImagesOutput = execSync('docker images --format "{{.Repository}}:{{.Tag}}"', { encoding: 'utf8' });
    const availableImagesSet = new Set(availableImagesOutput.trim().split('\n'));

    // Filter the desired list to find only the images that actually exist
    const imagesToBackup = desiredImages.filter(image => availableImagesSet.has(image));
    const missingImages = desiredImages.filter(image => !availableImagesSet.has(image));

    // Report missing images to the user
    if (missingImages.length > 0) {
      console.warn('\n⚠️  Warning: The following images were not found and will be skipped:');
      missingImages.forEach(image => console.warn(`   - ${image}`));
    }

    // If no images from our list are found, exit gracefully.
    if (imagesToBackup.length === 0) {
      console.log('\n✅ No matching images found to back up. Nothing to do.');
      return;
    }

    console.log(`\n✅ Found ${imagesToBackup.length} image(s) to back up.`);
    imagesToBackup.forEach(image => console.log(`   - ${image}`));

    // Create the backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      console.log(`\n📁 Creating directory: ${backupDir}`);
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Start the backup process with only the available images
    console.log('\n🚀 Starting backup process (this may take a while)...');
    const dockerSaveCommand = `docker save -o ${outputFile} ${imagesToBackup.join(' ')}`;
    
    execSync(dockerSaveCommand, { stdio: 'inherit' });

    console.log('\n✅ Backup completed successfully!');
    console.log(`📦 Backup saved to: ${path.resolve(outputFile)}`);

  } catch (error) {
    console.error('\n❌ Error: An unexpected error occurred during the backup.');
    console.error(error.message);
    process.exit(1);
  }
}

main();