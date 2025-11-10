// Scripts/createpostio.js
// Create PostIO container

const { execSync } = require('child_process');

console.log('Stopping existing mail-test container...');
try {
  execSync('docker stop mail-test', { stdio: 'pipe' });
} catch (error) {
  // Container might not be running, which is fine
}

console.log('Removing existing mail-test container...');
try {
  execSync('docker rm mail-test', { stdio: 'pipe' });
} catch (error) {
  // Container might not exist, which is fine
}

console.log('Starting new mail-test container...');
try {
  execSync('docker run -d --name mail-test -p 8080:80 -e "HTTPS=OFF" -v "C:\\poste-data:/data" analogic/poste.io', { stdio: 'pipe' });
  console.log('SUCCESS: PostIO container started');
} catch (error) {
  console.error('ERROR: Failed to start PostIO container:', error.message);
  process.exit(1);
}