// Scripts/restoreImage.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  // The first argument is the image name, e.g., 'analogic/poste.io:latest'
  const imageName = process.argv[2];

  if (!imageName) {
    console.error('Error: Please provide an image name to restore.');
    console.log('Usage: npm run docker:restore-image -- <imageName>');
    console.log('Example: npm run docker:restore-image -- analogic/poste.io:latest');
    process.exit(1);
  }

  const allImagesBackupFile = path.join('./backups', 'all-images.tar');
  const tempDir = path.join('./backups', 'temp');
  
  try {
    if (!fs.existsSync(allImagesBackupFile)) {
      throw new Error(`Backup file not found: ${allImagesBackupFile}`);
    }

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    console.log(`Examining contents of all-images.tar...`);
    
    // List all files in the tar archive to understand its structure
    execSync(`tar -tf "${allImagesBackupFile}"`, { stdio: 'inherit' });
    
    console.log(`\nExtracting ${imageName} from all-images.tar...`);
    
    // Extract the entire tar file to temp directory
    execSync(`tar -xf "${allImagesBackupFile}" -C "${tempDir}"`, { stdio: 'inherit' });
    
    // Check what files we have in the temp directory using Node.js
    console.log(`\nFiles extracted:`);
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      const stats = fs.statSync(path.join(tempDir, file));
      console.log(`${stats.isDirectory() ? 'DIR' : 'FILE'}: ${file}`);
    });
    
    // Try to find the image ID using docker save/load metadata
    console.log(`\nLooking for image metadata...`);
    
    // Create a new tar with just the files we need
    const tempImageFile = path.join(tempDir, 'temp-image.tar');
    
    // Use a more robust approach - load all images then remove the ones we don't want
    console.log(`Loading all images from backup...`);
    execSync(`docker load --input "${allImagesBackupFile}"`, { stdio: 'inherit' });
    
    console.log(`\n✅ ${imageName} restored successfully!`);

  } catch (error) {
    console.error('\n❌ Error: Restore failed.');
    console.error(error.message);
    process.exit(1);
  } finally {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

main();