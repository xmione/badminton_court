#!/usr/bin/env node
// Scripts/createpostio.js
// Create PostIO container

const { execSync } = require('child_process');
const os = require('os');

function sleep(seconds) {
  if (os.platform() === 'win32') {
    execSync(`timeout /t ${seconds}`, { stdio: 'pipe' });
  } else {
    execSync(`sleep ${seconds}`, { stdio: 'pipe' });
  }
}

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
  let volumePath;
  if (os.platform() === 'win32') {
    volumePath = 'C:\\poste-data:/data';
  } else {
    volumePath = '/tmp/poste-data:/data';
  }
  
  execSync(`docker run -d --name mail-test -p 8080:80 -e "HTTPS=OFF" -v "${volumePath}" analogic/poste.io`, { stdio: 'pipe' });
  console.log('SUCCESS: PostIO container started');
} catch (error) {
  console.error('ERROR: Failed to start PostIO container:', error.message);
  process.exit(1);
}