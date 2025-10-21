const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('--- Starting Certificate Generation (Node.js) ---');

const certDir = 'certs';
const certName = 'posteio';
const certSubject = '/CN=mail-test';

// Create certs directory if it doesn't exist
console.log('=> Ensuring certificate directory exists...');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

// Remove existing certificates
console.log('=> Removing existing certificates...');
const filesToRemove = [
  `${certName}-cert.pem`,
  `${certName}-key.pem`,
  'ca.pem'
];

filesToRemove.forEach(file => {
  const filePath = path.join(certDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
});

// Generate certificates using OpenSSL
console.log('=> Generating new certificates with OpenSSL...');
try {
  execSync(`openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "${path.join(certDir, `${certName}-key.pem`)}" \
    -out "${path.join(certDir, `${certName}-cert.pem`)}" \
    -subj "${certSubject}"`, { stdio: 'inherit' });
  
  // Create CA certificate
  console.log('=> Creating CA certificate...');
  const certContent = fs.readFileSync(path.join(certDir, `${certName}-cert.pem`));
  fs.writeFileSync(path.join(certDir, 'ca.pem'), certContent);
  
  console.log('--- Certificate Generation Complete ---');
} catch (error) {
  console.error('Error generating certificates:', error.message);
  process.exit(1);
}