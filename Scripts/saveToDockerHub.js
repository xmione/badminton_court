// scripts/saveToDockerHub.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function saveToDockerHub() {
  try {
    console.log('🔍 Getting list of running containers...');
    
    // Get running containers
    const containers = execSync('docker ps --format "table {{.Names}}\t{{.Image}}"', { encoding: 'utf8' });
    const containerLines = containers.trim().split('\n').slice(1); // Skip header
    
    if (containerLines.length === 0) {
      console.log('❌ No running containers found.');
      rl.close();
      return;
    }
    
    console.log('\n📦 Found running containers:');
    containerLines.forEach((line, index) => {
      const [name, image] = line.split('\t');
      console.log(`  ${index + 1}. ${name} (${image})`);
    });
    
    // Get Docker Hub username
    const dockerHubUsername = await question('\n📝 Enter your Docker Hub username: ');
    if (!dockerHubUsername) {
      console.log('❌ Docker Hub username is required.');
      rl.close();
      return;
    }
    
    // Get repository name prefix
    const repoPrefix = await question('📝 Enter repository name prefix (e.g., "badminton-court"): ') || 'badminton-court';
    
    // Get tag for this snapshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultTag = `${repoPrefix}-snapshot-${timestamp}`;
    const tag = await question(`📝 Enter tag for this snapshot (default: ${defaultTag}): `) || defaultTag;
    
    console.log('\n🚀 Starting save process...');
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, `docker-save-${timestamp}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    
    logStream.write(`=== Docker Save to Hub Log ===\n`);
    logStream.write(`Timestamp: ${new Date().toISOString()}\n`);
    logStream.write(`Docker Hub Username: ${dockerHubUsername}\n`);
    logStream.write(`Repository Prefix: ${repoPrefix}\n`);
    logStream.write(`Tag: ${tag}\n\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < containerLines.length; i++) {
      const line = containerLines[i];
      const [containerName, imageName] = line.split('\t');
      
      try {
        console.log(`\n📦 Processing container: ${containerName}`);
        logStream.write(`Processing container: ${containerName} (${imageName})\n`);
        
        // Create a clean image name for Docker Hub
        const cleanImageName = imageName.replace(/[^a-zA-Z0-9._-]/g, '-');
        const repoName = `${dockerHubUsername}/${repoPrefix}-${containerName}`;
        
        // Commit the container as a new image
        console.log(`  📋 Committing container as image: ${repoName}:${tag}`);
        logStream.write(`Committing: ${repoName}:${tag}\n`);
        execSync(`docker commit ${containerName} ${repoName}:${tag}`, { stdio: 'pipe' });
        
        // Push to Docker Hub
        console.log(`  ⬆️  Pushing to Docker Hub...`);
        logStream.write(`Pushing to Docker Hub...\n`);
        execSync(`docker push ${repoName}:${tag}`, { stdio: 'pipe' });
        
        // Save the image locally as backup
        const localBackupPath = path.join(process.cwd(), 'backups', 'docker-images');
        if (!fs.existsSync(localBackupPath)) {
          fs.mkdirSync(localBackupPath, { recursive: true });
        }
        
        const backupFile = path.join(localBackupPath, `${containerName}-${tag}.tar`);
        console.log(`  💾 Saving local backup to: ${backupFile}`);
        logStream.write(`Local backup: ${backupFile}\n`);
        execSync(`docker save -o ${backupFile} ${repoName}:${tag}`, { stdio: 'pipe' });
        
        console.log(`  ✅ Successfully saved: ${containerName}`);
        logStream.write(`✅ Success: ${containerName}\n\n`);
        successCount++;
        
      } catch (error) {
        console.log(`  ❌ Failed to save ${containerName}: ${error.message}`);
        logStream.write(`❌ Failed: ${containerName} - ${error.message}\n\n`);
        errorCount++;
      }
    }
    
    // Create a metadata file with all saved containers
    const metadata = {
      timestamp: new Date().toISOString(),
      dockerHubUsername,
      repoPrefix,
      tag,
      containers: containerLines.map(line => {
        const [name, image] = line.split('\t');
        return { name, originalImage: image, savedImage: `${dockerHubUsername}/${repoPrefix}-${name}:${tag}` };
      }),
      summary: {
        total: containerLines.length,
        success: successCount,
        errors: errorCount
      }
    };
    
    const metadataFile = path.join(logsDir, `docker-save-${timestamp}.json`);
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total containers: ${containerLines.length}`);
    console.log(`  Successfully saved: ${successCount}`);
    console.log(`  Failed: ${errorCount}`);
    console.log(`\n📄 Log file: ${logFile}`);
    console.log(`📄 Metadata file: ${metadataFile}`);
    console.log(`💾 Local backups saved in: ./backups/docker-images/`);
    
    if (errorCount > 0) {
      console.log(`\n⚠️  Some containers failed to save. Check the log file for details.`);
    } else {
      console.log(`\n✅ All containers saved successfully!`);
    }
    
    logStream.write(`\n=== Summary ===\n`);
    logStream.write(`Total: ${containerLines.length}, Success: ${successCount}, Errors: ${errorCount}\n`);
    logStream.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  saveToDockerHub();
}

module.exports = { saveToDockerHub };