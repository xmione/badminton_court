// Scripts/encryptenvfiles.js
// Encrypt .env files

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getPassphrase() {
  try {
    return execSync('node scripts/get-gh-variable.js', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error('ERROR: Failed to get passphrase:', error.message);
    process.exit(1);
  }
}

function encryptEnvFiles() {
  const passphrase = getPassphrase();
  console.log(`Using passphrase: ${passphrase}`);
  
  const envFiles = [
    '.env.dev',
    '.env.docker',
    'cypress.env.json'
  ];

  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const gpgOutputFile = `${file}.gpg`;
      const targetFile = `.e${file}`;
      
      console.log(`Encrypting ${file}...`);
      
      try {
        execSync(`gpg --batch --yes --pinentry-mode loopback --passphrase ${passphrase} -c ${file}`, { stdio: 'pipe' });
        
        if (fs.existsSync(gpgOutputFile)) {
          if (fs.existsSync(targetFile)) {
            fs.unlinkSync(targetFile);
          }
          fs.renameSync(gpgOutputFile, targetFile);
          console.log(`Encrypted successfully: ${targetFile}`);
        } else {
          console.warn(`Encryption failed for ${file}. GPG output not found.`);
        }
      } catch (error) {
        console.error(`ERROR: Failed to encrypt ${file}:`, error.message);
      }
    } else {
      console.warn(`${file} not found. Skipping.`);
    }
  });

  // Save passphrase to file (for CI/CD or decrypting later)
  const passFile = 'env.passphrase.txt';
  fs.writeFileSync(passFile, passphrase);
  console.log(`\nPassphrase saved to ${passFile}. Keep it safe!`);
}

encryptEnvFiles();