// Scripts/backupIndividual.js

const fs = require('fs');
const { execSync } = require('child_process');

// List of all possible images based on your docker-compose.yml services
const allPossibleImages = [
  'badminton_court-web-dev:latest',
  'badminton_court-web-test:latest',
  'badminton_court-celery:latest',
  'badminton_court-celery-beat:latest',
  'badminton_court-tunnel:latest',
  'badminton_court-cypress:latest',
  'badminton_court-presentation:latest',
  'badminton_court-test-setup:latest'
];

const backupFile = './backups/all-images.tar';

function main() {
  // Get the image names from the command line arguments
  const imagesToAddArgs = process.argv.slice(2);

  if (imagesToAddArgs.length === 0) {
    console.error('❌ Error: Please provide at least one image name to add to the backup.');
    console.log('Usage: npm run docker:backup-individual -- <imageName1> [imageName2] ...');
    console.log('Example: npm run docker:backup-individual -- web-dev');
    process.exit(1);
  }

  // Validate the provided image names
  const imagesToAdd = [];
  for (const arg of imagesToAddArgs) {
    const fullImageName = allPossibleImages.find(img => img.includes(arg));
    if (!fullImageName) {
      console.error(`❌ Error: Image "${arg}" is not a known service image.`);
      process.exit(1);
    }
    imagesToAdd.push(fullImageName);
  }

  // --- Check for existing backup and get its contents ---
  let existingImages = [];
  if (fs.existsSync(backupFile)) {
    console.log('📦 Found existing backup file. Checking its contents...');
    try {
      const manifestJson = execSync(`tar -xOf ${backupFile} manifest.json`, { encoding: 'utf8' });
      const manifest = JSON.parse(manifestJson);
      manifest.forEach(item => {
        if (item.RepoTags && item.RepoTags.length > 0) {
          existingImages.push(...item.RepoTags);
        }
      });
      console.log(`   -> Found ${existingImages.length} image(s) already in the backup.`);
    } catch (error) {
      console.warn('⚠️  Warning: Could not read existing backup manifest. It might be corrupted. A new backup will be created.');
    }
  } else {
    console.log('📦 No existing backup file found. A new one will be created.');
  }

  // --- Combine lists and remove duplicates ---
  const combinedImageList = [...new Set([...existingImages, ...imagesToAdd])];

  // --- Check if there's anything new to add ---
  const newImagesCount = combinedImageList.length - existingImages.length;
  if (newImagesCount === 0) {
    console.log('✅ All specified images are already in the backup. Nothing to do.');
    return;
  }

  console.log(`➕ Adding ${newImagesCount} new image(s) to the backup...`);
  imagesToAdd.forEach(img => console.log(`   -> ${img}`));

  // --- Ensure backup directory exists ---
  if (!fs.existsSync('./backups')) {
    fs.mkdirSync('./backups', { recursive: true });
  }

  // --- Rebuild the all-images.tar archive with the complete set of images ---
  console.log('\n🚀 Rebuilding all-images.tar with the complete set of images...');
  const dockerSaveCommand = `docker save -o ${backupFile} ${combinedImageList.join(' ')}`;
  
  try {
    execSync(dockerSaveCommand, { stdio: 'inherit' });
    console.log('\n✅ Backup updated successfully!');
  } catch (error) {
    console.error('\n❌ Error: Failed to update the backup.');
    console.error(error.message);
    process.exit(1);
  }
}

main();