#!/usr/bin/env node
// Scripts/docker-menu.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// Platform detection
const isWindows = os.platform() === 'win32';
const isMac = os.platform() === 'darwin';
const isLinux = os.platform() === 'linux';

function sleep(seconds) {
  if (os.platform() === 'win32') {
    execSync(`timeout /t ${seconds}`, { stdio: 'pipe' });
  } else {
    execSync(`sleep ${seconds}`, { stdio: 'pipe' });
  }
}

// Helper function to execute commands
function runCommand(command, options = {}) {
  try {
    const { stdout, stderr, error } = execSync(command, { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options 
    });
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

// =================================================================
// CORRECTED: checkEnvFile now accepts a parameter to skip the check
// This is CRITICAL for the 'decrypt' command to work when .env.docker is missing.
// =================================================================
function checkEnvFile(skipCheck = false) {
  // If skipCheck is true, we bypass the file existence check entirely.
  if (skipCheck) {
    console.log('\x1b[33mSkipping environment file check for decryption task.\x1b[0m');
    return true;
  }

  // Original logic runs if skipCheck is false
  const envFile = '.env.docker';
  if (!fs.existsSync(envFile)) {
    console.log('\x1b[31mERROR: .env.docker file not found in current directory!\x1b[0m');
    console.log(`\x1b[31mCurrent directory: ${process.cwd()}\x1b[0m`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(envFile, 'utf8').split('\n').slice(0, 5);
    console.log('\x1b[32m.env.docker file found. First 5 lines:\x1b[0m');
    content.forEach(line => console.log(`  \x1b[90m${line}\x1b[0m`));
    return true;
  } catch (error) {
    console.log(`\x1b[31mERROR: Cannot read .env.docker file: ${error.message}\x1b[0m`);
    return false;
  }
}

// Helper function to pause and wait for user input
function pause() {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('\x1b[33mPress Enter to continue...\x1b[0m', () => {
      rl.close();
      resolve();
    });
  });
}

// Helper function to get user input
function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Function to execute a specific menu option
async function executeMenuOption(choice) {
  switch (choice) {
    // Local Development
    case '1.1':
      console.log('\x1b[33mStarting local development environment...\x1b[0m');
      const localDevParam = await ask('Enter additional parameter for cruise-config.xml (optional): ');
      let localDevCommand = 'npm run dev';
      if (localDevParam) {
        localDevCommand += ` -- ${localDevParam}`;
      }
      runCommand(localDevCommand);
      await pause();
      break;
    case '1.2':
      console.log('\x1b[33mStarting local development environment (detached)...\x1b[0m');
      const localDevDetachedParam = await ask('Enter additional parameter for cruise-config.xml (optional): ');
      let localDevDetachedCommand = 'npm run dev:detached';
      if (localDevDetachedParam) {
        localDevDetachedCommand += ` -- ${localDevDetachedParam}`;
      }
      runCommand(localDevDetachedCommand);
      await pause();
      break;
    case '1.3':
      console.log('\x1b[33mStopping local dev server...\x1b[0m');
      runCommand('npm run dev:stop');
      await pause();
      break;
    case '1.4':
      console.log('\x1b[33mLoading local dev data...\x1b[0m');
      runCommand('npm run dev:load-data');
      await pause();
      break;
    case '1.5':
      console.log('\x1b[33mStarting dev tunnel...\x1b[0m');
      runCommand('npm run dev:tunnel');
      await pause();
      break;
      
    // Local Cypress Testing
    case '2.1':
      console.log('\x1b[33mOpening Cypress in interactive mode...\x1b[0m');
      runCommand('npm run dev:cypress-open');
      await pause();
      break;
    case '2.2':
      console.log('\x1b[33mRunning Cypress tests (headed)...\x1b[0m');
      runCommand('npm run dev:cypress-headed');
      await pause();
      break;
    case '2.3':
      console.log('\x1b[33mRunning Cypress tests (headless)...\x1b[0m');
      runCommand('npm run dev:cypress-headless');
      await pause();
      break;
    case '2.4':
      console.log('\x1b[33mRunning Cypress tests for presentation (headed)...\x1b[0m');
      runCommand('npm run dev:cypress-presentation');
      await pause();
      break;
    case '2.5':
      console.log('\x1b[33mSelect a Cypress test for presentation (headed)...\x1b[0m');
      runCommand('npm run dev:select-presentation');
      await pause();
      break;
    case '2.6':
      console.log('\x1b[33mRunning Post-Process Videos...\x1b[0m');
      runCommand('npm run dev:post-process-videos');
      await pause();
      break;
    case '2.7':
      const spec = await ask('Enter spec file path (optional): ');
      let cypressPresentationSpecCommand = 'npm run dev:cypress-presentation-spec';
      if (spec) {
        cypressPresentationSpecCommand += ` -- --spec ${spec}`;
      }
      runCommand(cypressPresentationSpecCommand);
      await pause();
      break;
    case '12.8':
      console.log('\x1b[33mSaving running containers to Docker Hub...\x1b[0m');
      runCommand('npm run docker:save-to-hub');
      await pause();
      break;
      
    // Docker Development Environment
    case '3.1':
      console.log('\x1b[33mStarting development environment...\x1b[0m');
      const dockerDevParam = await ask('Enter additional parameter for cruise-config.xml (optional): ');
      let dockerDevCommand = 'npm run docker:dev';
      if (dockerDevParam) {
        dockerDevCommand += ` -- ${dockerDevParam}`;
      }
      runCommand(dockerDevCommand);
      await pause();
      break;
    case '3.2':
      console.log('\x1b[33mStarting development environment (detached)...\x1b[0m');
      const dockerDevDetachedParam = await ask('Enter additional parameter for cruise-config.xml (optional): ');
      let dockerDevDetachedCommand = 'npm run docker:dev-detached';
      if (dockerDevDetachedParam) {
        dockerDevDetachedCommand += ` -- ${dockerDevDetachedParam}`;
      }
      runCommand(dockerDevDetachedCommand);
      await pause();
      break;
    case '3.3':
      console.log('\x1b[33mStopping development services...\x1b[0m');
      runCommand('npm run docker:dev-stop');
      await pause();
      break;
    case '3.4':
      console.log('\x1b[33mShowing development logs...\x1b[0m');
      runCommand('npm run docker:dev-logs');
      await pause();
      break;
    case '3.5':
      console.log('\x1b[33mRestarting web-dev container...\x1b[0m');
      runCommand('npm run docker:dev-restart');
      await pause();
      break;
    case '3.6':
      console.log('\x1b[33mStarting dev environment with certificates...\x1b[0m');
      runCommand('npm run docker:dev-start');
      await pause();
      break;
    case '3.7':
      console.log('\x1b[33mResetting and starting dev environment...\x1b[0m');
      runCommand('npm run docker:dev-reset-and-start');
      await pause();
      break;
    case '3.8':
      console.log('\x1b[33mForce recreating dev containers...\x1b[0m');
      runCommand('npm run docker:dev-recreate');
      await pause();
      break;
      
    // Docker Testing Environment
    case '4.1':
      console.log('\x1b[33mStarting test environment...\x1b[0m');
      runCommand('npm run docker:test');
      await pause();
      break;
    case '4.2':
      console.log('\x1b[33mStarting test environment (detached)...\x1b[0m');
      runCommand('npm run docker:test-detached');
      await pause();
      break;
    case '4.3':
      console.log('\x1b[33mStopping test services...\x1b[0m');
      runCommand('npm run docker:test-stop');
      await pause();
      break;
    case '4.4':
      console.log('\x1b[33mShowing test logs...\x1b[0m');
      runCommand('npm run docker:test-logs');
      await pause();
      break;
    case '4.5':
      console.log('\x1b[33mSetting up test data...\x1b[0m');
      runCommand('npm run docker:test-setup');
      await pause();
      break;
      
    // Docker Cypress Testing
    case '5.1':
      console.log('\x1b[33mStarting Cypress container...\x1b[0m');
      runCommand('npm run docker:cypress-start');
      await pause();
      break;
    case '5.2':
      console.log('\x1b[33mOpening Cypress in existing container...\x1b[0m');
      runCommand('npm run docker:cypress-open');
      await pause();
      break;
    case '5.3':
      console.log('\x1b[33mRunning Cypress tests in existing container...\x1b[0m');
      runCommand('npm run docker:cypress-run');
      await pause();
      break;
    case '5.4':
      console.log('\x1b[33mStopping Cypress container...\x1b[0m');
      runCommand('npm run docker:cypress-stop');
      await pause();
      break;
    case '5.5':
      console.log('\x1b[33mRunning Cypress tests (headed) in new container...\x1b[0m');
      runCommand('npm run docker:cypress-run-headed');
      await pause();
      break;
    case '5.6':
      console.log('\x1b[33mRunning Cypress tests (headless) in new container...\x1b[0m');
      runCommand('npm run docker:cypress-run-headless');
      await pause();
      break;
    case '5.7':
      console.log('\x1b[33mRunning connectivity tests (headless)...\x1b[0m');
      runCommand('npm run docker:cypress-run-connectivity');
      await pause();
      break;
      
    // Docker Presentation Environment
    case '6.1':
      console.log('\x1b[33mSelect and run Cypress test for presentation...\x1b[0m');
      runCommand('npm run docker:select-presentation');
      await pause();
      break;
    case '6.2':
      console.log('\x1b[33mPost-processing videos in Docker...\x1b[0m');
      runCommand('npm run docker:post-process-videos');
      await pause();
      break;
    case '6.3':
      const presentationSpec = await ask('Enter spec file path (optional): ');
      let dockerCypressPresentationSpecCommand = 'npm run docker:cypress-presentation-spec';
      if (presentationSpec) {
        dockerCypressPresentationSpecCommand += ` -- --spec ${presentationSpec}`;
      }
      runCommand(dockerCypressPresentationSpecCommand);
      await pause();
      break;
      
    // Docker Tunnel Management
    case '7.1':
      console.log('\x1b[33mBuilding tunnel service...\x1b[0m');
      runCommand('npm run docker:tunnel-build');
      await pause();
      break;
    case '7.2':
      console.log('\x1b[33mBuilding tunnel service (no cache)...\x1b[0m');
      runCommand('npm run docker:tunnel-build-nocache');
      await pause();
      break;
    case '7.3':
      console.log('\x1b[33mStarting docker tunnel...\x1b[0m');
      runCommand('npm run docker:tunnel');
      await pause();
      break;
    case '7.4':
      console.log('\x1b[33mStarting docker tunnel (detached)...\x1b[0m');
      runCommand('npm run docker:tunnel-detached');
      await pause();
      break;
    case '7.5':
      console.log('\x1b[33mStopping docker tunnel...\x1b[0m');
      runCommand('npm run docker:tunnel-stop');
      await pause();
      break;
    case '7.6':
      console.log('\x1b[33mShowing tunnel logs...\x1b[0m');
      runCommand('npm run docker:tunnel-logs');
      await pause();
      break;
      
    // Docker Database Management
    case '8.1':
      console.log('\x1b[33mRunning database migrations in dev container...\x1b[0m');
      runCommand('npm run docker:dev-migrate');
      await pause();
      break;
    case '8.2':
      console.log('\x1b[33mResetting database...\x1b[0m');
      runCommand('npm run docker:reset-db');
      await pause();
      break;
    case '8.3':
      console.log('\x1b[33mResetting database with migrations...\x1b[0m');
      runCommand('npm run docker:reset-db-migrate');
      await pause();
      break;
    case '8.4':
      console.log('\x1b[33mFull database reset with test data...\x1b[0m');
      runCommand('npm run docker:reset-db-full');
      await pause();
      break;
      
    // Docker Image Management
    case '9.1':
      console.log('\x1b[33mBuilding all service images...\x1b[0m');
      runCommand('npm run docker:build');
      await pause();
      break;
    case '9.2':
      console.log('\x1b[33mBuilding all service images (no cache)...\x1b[0m');
      runCommand('npm run docker:build-nocache');
      await pause();
      break;
    case '9.3':
      console.log('\x1b[33mBuilding dev service images...\x1b[0m');
      runCommand('npm run docker:build-dev');
      await pause();
      break;
    case '9.4':
      console.log('\x1b[33mBuilding dev service images (no cache)...\x1b[0m');
      runCommand('npm run docker:build-dev-nocache');
      await pause();
      break;
    case '9.5':
      console.log('\x1b[33mBuilding Cypress service image...\x1b[0m');
      runCommand('npm run docker:build-cypress');
      await pause();
      break;
    case '9.6':
      console.log('\x1b[33mBuilding Cypress service image (no cache)...\x1b[0m');
      runCommand('npm run docker:build-cypress-nocache');
      await pause();
      break;
    case '9.7':
      console.log('\x1b[33mBuilding presentation service images...\x1b[0m');
      runCommand('npm run docker:build-presentation');
      await pause();
      break;
    case '9.8':
      console.log('\x1b[33mBuilding presentation service images (no cache)...\x1b[0m');
      runCommand('npm run docker:build-presentation-nocache');
      await pause();
      break;
      
    // Docker System Management
    case '10.1':
      console.log('\x1b[33mCompletely rebuilding all services...\x1b[0m');
      runCommand('npm run docker:rebuild');
      await pause();
      break;
    case '10.2':
      console.log('\x1b[33mRebuilding dev services...\x1b[0m');
      runCommand('npm run docker:rebuild-dev');
      await pause();
      break;
    case '10.3':
      console.log('\x1b[33mRebuilding test services...\x1b[0m');
      runCommand('npm run docker:rebuild-test');
      await pause();
      break;
    case '10.4':
      console.log('\x1b[33mRebuilding presentation services...\x1b[0m');
      runCommand('npm run docker:rebuild-presentation');
      await pause();
      break;
    case '10.5':
      console.log('\x1b[33mShowing service logs...\x1b[0m');
      runCommand('npm run docker:logs');
      await pause();
      break;
    case '10.6':
      const serviceName = await ask('Enter service name: ');
      runCommand(`npm run docker:shell -- ${serviceName}`);
      await pause();
      break;
    case '10.7':
      console.log('\x1b[33mStopping all services and removing volumes...\x1b[0m');
      runCommand('npm run docker:down-volumes');
      await pause();
      break;
    case '10.8':
      console.log('\x1b[33mCleaning up unused Docker resources...\x1b[0m');
      runCommand('npm run docker:prune');
      await pause();
      break;
    case '10.9':
      console.log('\x1b[33mResetting environment...\x1b[0m');
      runCommand('npm run docker:reset');
      await pause();
      break;
    case '10.10':
      console.log('\x1b[33mResetting environment (keeping images)...\x1b[0m');
      runCommand('npm run docker:reset-keep-images');
      await pause();
      break;
    case '10.11':
      console.log('\x1b[33mShowing service status...\x1b[0m');
      runCommand('npm run status');
      await pause();
      break;
      
    // Advanced Cleanup
    case '11.1':
      console.log('\x1b[33mPerforming complete system cleanup...\x1b[0m');
      runCommand('npm run docker:system-prune-all');
      await pause();
      break;
    case '11.2':
      console.log('\x1b[33mPerforming deep cleanup with Docker Desktop restart...\x1b[0m');
      if (isWindows) {
        runCommand('taskkill /F /IM "Docker Desktop"');
        console.log('\x1b[33mWaiting for Docker Desktop to fully terminate...\x1b[0m');
        runCommand('timeout /t 10');
        console.log('\x1b[33mCleaning up Docker resources...\x1b[0m');
        runCommand('docker system prune -a --volumes');
        console.log('\x1b[33mStarting Docker Desktop...\x1b[0m');
        runCommand('start ""C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe""');
        console.log('\x1b[33mWaiting for Docker Desktop to initialize...\x1b[0m');
        runCommand('timeout /t 30');
        console.log('\x1b[32mDocker Desktop should be starting up. Please wait for it to fully initialize.\x1b[0m');
      } else {
        runCommand('pkill -f "Docker Desktop"');
        console.log('\x1b[33mWaiting for Docker Desktop to fully terminate...\x1b[0m');
        sleep(10);
        console.log('\x1b[33mCleaning up Docker resources...\x1b[0m');
        runCommand('docker system prune -a --volumes');
        console.log('\x1b[33mStarting Docker Desktop...\x1b[0m');
        runCommand('open -a Docker Desktop');
        console.log('\x1b[33mWaiting for Docker Desktop to initialize...\x1b[0m');
        sleep(30);
        console.log('\x1b[32mDocker Desktop should be starting up. Please wait for it to fully initialize.\x1b[0m');
      }
      await pause();
      break;
    case '11.3':
      console.log('\x1b[31mWARNING: This will reset Docker Desktop to factory defaults!\x1b[0m');
      console.log('\x1b[31mAll images, containers, and settings will be lost.\x1b[0m');
      const confirm = await ask('Are you sure you want to continue? (y/n): ');
      if (confirm === 'y') {
        console.log('\x1b[33mResetting Docker Desktop to factory defaults...\x1b[0m');
        console.log('\x1b[33mPlease manually reset Docker Desktop by:\x1b[0m');
        console.log('\x1b[33m1. Opening Docker Desktop\x1b[0m');
        console.log('\x1b[33m2. Going to Settings > Troubleshooting\x1b[0m');
        console.log('\x1b[33m3. Clicking \'Reset to factory defaults\'\x1b[0m');
        console.log('\x1b[33m4. Waiting for reset to complete\x1b[0m');
      }
      await pause();
      break;
    case '11.4':
      console.log('\x1b[33mCleaning Docker content store to fix \'blob not found\' errors...\x1b[0m');
      if (isWindows) {
        runCommand('taskkill /F /IM "Docker Desktop"');
        console.log('\x1b[33mWaiting for Docker Desktop to fully terminate...\x1b[0m');
        runCommand('timeout /t 10');
        console.log('\x1b[33mCleaning up Docker resources...\x1b[0m');
        runCommand('docker system prune -a --volumes');
        console.log('\x1b[33mStarting Docker Desktop...\x1b[0m');
        runCommand('start ""C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe""');
        console.log('\x1b[33mWaiting for Docker Desktop to initialize...\x1b[0m');
        runCommand('timeout /t 30');
        console.log('\x1b[32mDocker Desktop should be starting up. Please wait for it to fully initialize.\x1b[0m');
      } else {
        runCommand('pkill -f "Docker Desktop"');
        console.log('\x1b[33mWaiting for Docker Desktop to fully terminate...\x1b[0m');
        sleep(10);
        console.log('\x1b[33mCleaning up Docker resources...\x1b[0m');
        runCommand('docker system prune -a --volumes');
        console.log('\x1b[33mStarting Docker Desktop...\x1b[0m');
        runCommand('open -a Docker Desktop');
        console.log('\x1b[33mWaiting for Docker Desktop to initialize...\x1b[0m');
        sleep(30);
        console.log('\x1b[32mDocker Desktop should be starting up. Please wait for it to fully initialize.\x1b[0m');
      }
      await pause();
      break;
    case '11.5':
      console.log('\x1b[31mWARNING: This will completely reset Docker\'s content store!\x1b[0m');
      console.log('\x1b[31mThis is the most aggressive cleanup option and should fix \'blob not found\' errors.\x1b[0m');
      const confirmReset = await ask('Are you sure you want to continue? (y/n): ');
      if (confirmReset === 'y') {
        runCommand('npm run docker:desktop-reset');
        console.log('\x1b[32mYou can now use option 11.6 to completely reset and restart your environment.\x1b[0m');
      }
      await pause();
      break;
    case '11.6':
      console.log('\x1b[31mWARNING: This will completely reset Docker and rebuild everything from scratch!\x1b[0m');
      console.log('\x1b[31mThis will remove all Docker resources and rebuild all images before starting dev environment.\x1b[0m');
      const confirmResetRebuild = await ask('Are you sure you want to continue? (y/n): ');
      if (confirmResetRebuild === 'y') {
        runCommand('npm run docker:desktop-reset-and-rebuild');
      }
      await pause();
      break;
      
    // Backup & Restore
    case '12.1':
      console.log('\x1b[33mBacking up all Docker images...\x1b[0m');
      runCommand('npm run docker:backup-images');
      await pause();
      break;
    case '12.2':
      console.log('\x1b[33mRestoring all Docker images...\x1b[0m');
      runCommand('npm run docker:restore-images');
      await pause();
      break;
    case '12.3':
      const backupImageNames = await ask('Enter image name(s) to backup: ');
      runCommand(`npm run docker:backup-individual -- ${backupImageNames}`);
      await pause();
      break;
    case '12.4':
      const restoreImageName = await ask('Enter image name to restore: ');
      runCommand(`npm run docker:restore-image -- ${restoreImageName}`);
      await pause();
      break;
    case '12.5':
      console.log('\x1b[33mListing available backup files...\x1b[0m');
      runCommand('npm run docker:list-backups');
      await pause();
      break;
    case '12.6':
      console.log('\x1b[33mListing backup contents...\x1b[0m');
      runCommand('npm run docker:list-backup-contents');
      await pause();
      break;
    case '12.7':
      console.log('\x1b[33mListing backup image names...\x1b[0m');
      runCommand('npm run docker:list-backup-image-names');
      await pause();
      break;
      
    // Utilities
    case '13.1':
      console.log('\x1b[33mCreating SSL certificates for development...\x1b[0m');
      runCommand('npm run certs:create');
      await pause();
      break;
    case '13.2':
      const utilityServiceName = await ask('Enter service name: ');
      runCommand(`npm run shell -- ${utilityServiceName}`);
      await pause();
      break;
    case '13.3':
      console.log('\x1b[33mPrinting project folder structure...\x1b[0m');
      runCommand('npm run pfs');
      await pause();
      break;
    case '13.4':
      console.log('\x1b[33mRunning PSQL...\x1b[0m');
      runCommand('npm run psql');
      await pause();
      break;
    case '13.5':
      console.log('\x1b[33mEncrypting .env files...\x1b[0m');
      runCommand('npm run encryptenvfiles');
      await pause();
      break;
    case '13.6':
      console.log('\x1b[33mDecrypting .env files...\x1b[0m');
      runCommand('npm run decryptenvfiles');
      await pause();
      break;
    case '13.7':
      console.log('\x1b[33mCreating PostIO container...\x1b[0m');
      runCommand('npm run createpostio');
      await pause();
      break;
      
    // Docker Compose Management
    case '14.1':
      console.log('\x1b[33mStopping all Docker Compose containers...\x1b[0m');
      runCommand('docker-compose --env-file .env.docker down');
      console.log('\x1b[32mAll containers stopped successfully!\x1b[0m');
      await pause();
      break;
    case '14.2':
      console.log('\x1b[33mRemoving all Docker Compose containers...\x1b[0m');
      runCommand('docker-compose --env-file .env.docker down -v');
      console.log('\x1b[32mAll containers removed successfully!\x1b[0m');
      await pause();
      break;
    case '14.3':
      console.log('\x1b[33mRemoving all Docker Compose images...\x1b[0m');
      runCommand('docker-compose --env-file .env.docker down -v --rmi all');
      console.log('\x1b[32mAll images removed successfully!\x1b[0m');
      await pause();
      break;
    case '14.4':
      console.log('\x1b[33mSystem pruning all Docker Compose related objects...\x1b[0m');
      runCommand('docker-compose --env-file .env.docker down -v --rmi all');
      runCommand('docker system prune -a --volumes -f');
      console.log('\x1b[32mSystem prune completed successfully!\x1b[0m');
      await pause();
      break;
      
    case '15':
      console.log('\x1b[32mExiting...\x1b[0m');
      process.exit(0);
      
    default:
      console.log('\x1b[31mInvalid option. Press Enter to continue...\x1b[0m');
      await pause();
      break;
  }
}

// Main menu function
async function showMenu() {
  while (true) {
    // Clear screen (platform-specific)
    if (isWindows) {
      runCommand('cls');
    } else {
      runCommand('clear');
    }
    
    console.log('\x1b[32mDocker Management Menu\x1b[0m');
    console.log('\x1b[32m========================\x1b[0m');
    console.log('');
    console.log('\x1b[36m1. LOCAL DEVELOPMENT\x1b[0m');
    console.log('   1.1. Start local development environment');
    console.log('   1.2. Start local development environment (detached)');
    console.log('   1.3. Stop local dev server');
    console.log('   1.4. Load local dev data');
    console.log('   1.5. Start dev tunnel');
    console.log('');
    console.log('\x1b[36m2. LOCAL CYPRESS TESTING\x1b[0m');
    console.log('   2.1. Open Cypress in interactive mode');
    console.log('   2.2. Run Cypress tests (headed)');
    console.log('   2.3. Run Cypress tests (headless)');
    console.log('   2.4. Run Cypress tests for presentation (headed)');
    console.log('   2.5. Select a Cypress test for presentation (headed)');
    console.log('   2.6. Run Post-Process Videos');
    console.log('   2.7. Run Cypress tests for presentation spec (headed)');
    console.log('   12.8. Save running containers to Docker Hub');
    console.log('');
    console.log('\x1b[36m3. DOCKER DEVELOPMENT ENVIRONMENT\x1b[0m');
    console.log('   3.1. Start development environment');
    console.log('   3.2. Start development environment (detached)');
    console.log('   3.3. Stop development services');
    console.log('   3.4. Show development logs');
    console.log('   3.5. Restart web-dev container');
    console.log('   3.6. Start dev environment with certificates');
    console.log('   3.7. Reset and start dev environment');
    console.log('   3.8. Force recreate dev containers (keeps existing images)');
    console.log('');
    console.log('\x1b[36m4. DOCKER TESTING ENVIRONMENT\x1b[0m');
    console.log('   4.1. Start test environment');
    console.log('   4.2. Start test environment (detached)');
    console.log('   4.3. Stop test services');
    console.log('   4.4. Show test logs');
    console.log('   4.5. Setup test data');
    console.log('');
    console.log('\x1b[36m5. DOCKER CYPRESS TESTING\x1b[0m');
    console.log('   5.1. Start Cypress container');
    console.log('   5.2. Open Cypress in existing container');
    console.log('   5.3. Run Cypress tests in existing container');
    console.log('   5.4. Stop Cypress container');
    console.log('   5.5. Run Cypress tests (headed) in new container');
    console.log('   5.6. Run Cypress tests (headless) in new container');
    console.log('   5.7. Run connectivity tests (headless)');
    console.log('');
    console.log('\x1b[36m6. DOCKER PRESENTATION ENVIRONMENT\x1b[0m');
    console.log('   6.1. Select and run Cypress test for presentation');
    console.log('   6.2. Post-process videos in Docker');
    console.log('   6.3. Run Cypress tests for presentation spec');
    console.log('');
    console.log('\x1b[36m7. DOCKER TUNNEL MANAGEMENT\x1b[0m');
    console.log('   7.1. Build tunnel service');
    console.log('   7.2. Build tunnel service (no cache)');
    console.log('   7.3. Start docker tunnel');
    console.log('   7.4. Start docker tunnel (detached)');
    console.log('   7.5. Stop docker tunnel');
    console.log('   7.6. Show tunnel logs');
    console.log('');
    console.log('\x1b[36m8. DOCKER DATABASE MANAGEMENT\x1b[0m');
    console.log('   8.1. Run database migrations in dev container');
    console.log('   8.2. Reset database');
    console.log('   8.3. Reset database with migrations');
    console.log('   8.4. Full database reset with test data');
    console.log('');
    console.log('\x1b[36m9. DOCKER IMAGE MANAGEMENT\x1b[0m');
    console.log('   9.1. Build all service images');
    console.log('   9.2. Build all service images (no cache)');
    console.log('   9.3. Build dev service images');
    console.log('   9.4. Build dev service images (no cache)');
    console.log('   9.5. Build Cypress service image');
    console.log('   9.6. Build Cypress service image (no cache)');
    console.log('   9.7. Build presentation service images');
    console.log('   9.8. Build presentation service images (no cache)');
    console.log('');
    console.log('\x1b[36m10. DOCKER SYSTEM MANAGEMENT\x1b[0m');
    console.log('   10.1. Completely rebuild all services');
    console.log('   10.2. Rebuild dev services');
    console.log('   10.3. Rebuild test services');
    console.log('   10.4. Rebuild presentation services');
    console.log('   10.5. Show service logs');
    console.log('   10.6. Open shell in service container');
    console.log('   10.7. Stop all services and remove volumes');
    console.log('   10.8. Clean up unused Docker resources');
    console.log('   10.9. Reset environment (remove all)');
    console.log('   10.10. Reset environment (keep images)');
    console.log('   10.11. Show service status');
    console.log('');
    console.log('\x1b[36m11. ADVANCED CLEANUP\x1b[0m');
    console.log('   11.1. Complete system cleanup (removes all images, containers, volumes)');
    console.log('   11.2. Deep cleanup with Docker Desktop restart');
    console.log('   11.3. Factory reset Docker Desktop');
    console.log('   11.4. Clean Docker content store (fixes \'blob not found\' errors)');
    console.log('   11.5. COMPLETE Docker reset (fixes content store corruption)');
    console.log('   11.6. COMPLETE Docker reset and restart dev environment');
    console.log('');
    console.log('\x1b[36m12. BACKUP & RESTORE\x1b[0m');
    console.log('   12.1. Backup all Docker images');
    console.log('   12.2. Restore all Docker images');
    console.log('   12.3. Backup individual images');
    console.log('   12.4. Restore specific image');
    console.log('   12.5. List backup files');
    console.log('   12.6. List backup contents');
    console.log('   12.7. List backup image names');
    console.log('   12.8. Save running containers to Docker Hub');
    console.log('');
    console.log('\x1b[36m13. UTILITIES\x1b[0m');
    console.log('   13.1. Create SSL certificates for development');
    console.log('   13.2. Open shell in service container');
    console.log('   13.3. Print project folder structure');
    console.log('   13.4. Run PSQL');
    console.log('   13.5. Encrypt .env files');
    console.log('   13.6. Decrypt .env files');
    console.log('   13.7. Create PostIO container');
    console.log('');
    console.log('\x1b[36m14. DOCKER COMPOSE MANAGEMENT\x1b[0m');
    console.log('   14.1. Stop all docker compose containers');
    console.log('   14.2. Remove all docker compose containers');
    console.log('   14.3. Remove all docker compose images');
    console.log('   14.4. System prune all related compose file objects');
    console.log('');
    console.log('\x1b[36m15. Exit\x1b[0m');
    console.log('');
    
    const choice = await ask('Select an option (e.g., 1.1, 2.3, or 15): ');
    
    // Handle menu choices
    await executeMenuOption(choice);
  }
}

// =================================================================
// CORRECTED: Main execution block wrapped in an async function
// to eliminate top-level await and conform to CommonJS.
// =================================================================
async function main() {
  // Check if menu options are provided as command line arguments
  const isDecryptCommand = process.argv.includes('13.6');
  if (checkEnvFile(isDecryptCommand)) {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
      // Execute the provided menu options in sequence
      for (const choice of args) {
        console.log(`\x1b[33mExecuting menu option: ${choice}\x1b[0m`);
        await executeMenuOption(choice);
      }
      process.exit(0);
    } else {
      // Show the interactive menu if no arguments are provided
      await showMenu();
    }
  }
}

// Run the main function and catch any unhandled errors
main().catch(err => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
});