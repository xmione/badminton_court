#!/usr/bin/env node
// Scripts/docker-desktop-reset.js
// Reset Docker Desktop to factory defaults

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function sleep(seconds) {
  if (os.platform() === 'win32') {
    // Use PowerShell's Start-Sleep command on Windows
    execSync(`powershell -Command "Start-Sleep -Seconds ${seconds}"`, { stdio: 'pipe' });
  } else {
    execSync(`sleep ${seconds}`, { stdio: 'pipe' });
  }
}

function resetDockerDesktop(skipRebuild = false) {
  console.log('\x1b[33mStopping all Docker processes...\x1b[0m');
  
  try {
    if (os.platform() === 'win32') {
      execSync('taskkill /F /IM "Docker Desktop.exe"', { stdio: 'pipe' });
      execSync('taskkill /F /IM "com.docker.backend.exe"', { stdio: 'pipe' });
    } else {
      execSync('pkill -f "Docker Desktop"', { stdio: 'pipe' });
    }
  } catch (error) {
    // Process might not be running, which is fine
  }
  
  console.log('\x1b[33mWaiting for processes to fully terminate...\x1b[0m');
  sleep(10);
  
  if (os.platform() === 'win32') {
    console.log('\x1b[33mClearing Docker\'s content store...\x1b[0m');
    try {
      const localAppData = process.env.LOCALAPPDATA;
      const appData = process.env.APPDATA;
      
      if (localAppData && fs.existsSync(`${localAppData}\\Docker`)) {
        execSync(`rmdir /s /q "${localAppData}\\Docker"`, { stdio: 'pipe' });
      }
      
      if (appData && fs.existsSync(`${appData}\\Docker`)) {
        execSync(`rmdir /s /q "${appData}\\Docker"`, { stdio: 'pipe' });
      }
    } catch (error) {
      // Directories might not exist, which is fine
    }
    
    console.log('\x1b[33mStarting Docker Desktop...\x1b[0m');
    execSync('start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"', { stdio: 'pipe' });
  } else {
    console.log('\x1b[33mStarting Docker Desktop...\x1b[0m');
    execSync('open -a Docker Desktop', { stdio: 'pipe' });
  }
  
  console.log('\x1b[33mWaiting for Docker Desktop to fully initialize...\x1b[0m');
  
  const maxWaitTime = 180; // Maximum wait time in seconds
  let elapsedTime = 0;
  let dockerReady = false;
  
  while (!dockerReady && elapsedTime < maxWaitTime) {
    try {
      execSync('docker version', { stdio: 'pipe' });
      dockerReady = true;
      console.log('\x1b[32mDocker Desktop is fully initialized!\x1b[0m');
    } catch (error) {
      console.log(`\x1b[33mWaiting for Docker Desktop to initialize... (${elapsedTime}/${maxWaitTime} seconds)\x1b[0m`);
      sleep(5);
      elapsedTime += 5;
    }
  }
  
  if (dockerReady) {
    console.log('\x1b[33mForce removing all containers...\x1b[0m');
    try {
      execSync('docker container rm -f $(docker container ls -aq)', { stdio: 'pipe' });
    } catch (error) {
      // No containers to remove
    }
    
    // Specifically target the mail-test container if it still exists
    try {
      const mailTestContainer = execSync('docker container ls -q -f name=mail-test', { encoding: 'utf8' }).trim();
      if (mailTestContainer) {
        console.log('\x1b[33mForce removing mail-test container...\x1b[0m');
        execSync('docker container rm -f mail-test', { stdio: 'pipe' });
      }
    } catch (error) {
      // Container doesn't exist
    }
    
    console.log('\x1b[33mForce removing all images...\x1b[0m');
    try {
      execSync('docker image rm -f $(docker image ls -aq)', { stdio: 'pipe' });
    } catch (error) {
      // No images to remove
    }
    
    // Specifically target the analogic/poste.io image if it still exists
    try {
      const posteImage = execSync('docker image ls -q analogic/poste.io', { encoding: 'utf8' }).trim();
      if (posteImage) {
        console.log('\x1b[33mForce removing analogic/poste.io image...\x1b[0m');
        execSync('docker image rm -f analogic/poste.io', { stdio: 'pipe' });
      }
    } catch (error) {
      // Image doesn't exist
    }
    
    console.log('\x1b[33mRemoving all volumes...\x1b[0m');
    try {
      execSync('docker volume rm -f $(docker volume ls -q)', { stdio: 'pipe' });
    } catch (error) {
      // No volumes to remove
    }
    
    console.log('\x1b[33mPerforming complete system cleanup...\x1b[0m');
    execSync('docker system prune -a --volumes -f', { stdio: 'pipe' });
    
    if (!skipRebuild) {
      console.log('\x1b[33mBuilding all images with no cache...\x1b[0m');
      try {
        execSync('npm run docker:build-nocache', { stdio: 'inherit' });
        
        console.log('\x1b[33mImages built successfully. Now recreating dev containers...\x1b[0m');
        execSync('npm run docker:dev-recreate', { stdio: 'inherit' });
        console.log('\x1b[32mComplete reset, rebuild, and restart finished!\x1b[0m');
      } catch (error) {
        console.error('\x1b[31mImage build failed. Please check the error messages above.\x1b[0m');
        console.error('\x1b[31mYou may need to build the images manually with: npm run docker:build-nocache\x1b[0m');
        process.exit(1);
      }
    } else {
      console.log('\x1b[32mDocker reset completed successfully!\x1b[0m');
    }
  } else {
    console.error('\x1b[31mDocker Desktop failed to initialize within the expected time.\x1b[0m');
    console.error('\x1b[31mYou may need to restart Docker Desktop manually and then run the cleanup again.\x1b[0m');
    process.exit(1);
  }
}

// Option 11.5: Reset only
resetDockerDesktop(true);