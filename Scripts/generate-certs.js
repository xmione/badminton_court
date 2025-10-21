const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const sudo = require('sudo-prompt');

console.log('--- Starting Certificate Generation and Host Configuration (Node.js) ---');

const certDir = 'certs';
const certName = 'posteio';
const hostname = 'mail-test';
const hostIp = '127.0.0.1';

// --- Helper Functions for Privileged Tasks ---

function addToHosts() {
  const hostsPath = os.platform() === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts';
  const entry = `${hostIp}\t${hostname}`;

  try {
    const hostsContent = fs.readFileSync(hostsPath, 'utf8');
    if (hostsContent.includes(hostname)) {
      console.log(`=> Hosts file already contains an entry for '${hostname}'. Skipping.`);
      return;
    }
  } catch (error) {
    // Ignore read errors, we'll try to append.
  }

  console.log(`=> Adding "${entry}" to your hosts file...`);
  fs.appendFileSync(hostsPath, `\n# Added by badminton_court project\n${entry}\n`);
  console.log('✓ Successfully updated hosts file.');
}

function trustCa() {
  const caPath = path.resolve(certDir, 'ca.pem');
  console.log(`=> Trusting the CA certificate at '${caPath}'...`);

  try {
    if (os.platform() === 'win32') {
      execSync(`certutil -addstore -f "Root" "${caPath}"`, { stdio: 'inherit' });
      console.log('✓ Successfully trusted CA certificate on Windows.');
    } else if (os.platform() === 'darwin') {
      execSync(`security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${caPath}"`, { stdio: 'inherit' });
      console.log('✓ Successfully trusted CA certificate on macOS.');
    } else {
      // Linux command (Debian/Ubuntu based)
      execSync(`cp "${caPath}" /usr/local/share/ca-certificates/`, { stdio: 'inherit' });
      execSync('update-ca-certificates', { stdio: 'inherit' });
      console.log('✓ Successfully trusted CA certificate on Linux (Debian/Ubuntu).');
    }
  } catch (error) {
    console.error('✖ Failed to trust the CA certificate. This should not happen with elevated privileges.');
    console.error(error);
    process.exit(1);
  }
}

function clearOsSslCache() {
  console.log('=> Clearing the OS SSL cache...');
  try {
    if (os.platform() === 'win32') {
      execSync('certutil -pulse', { stdio: 'inherit' });
      console.log('✓ Successfully cleared the Windows SSL state.');
    }
  } catch (error) {
    console.warn('⚠ Could not clear the OS SSL cache. This is not critical, but may require a browser restart.');
  }
}

// --- Main Script Logic ---

function generateCertificates() {
  console.log('=> Ensuring certificate directory exists...');
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  console.log('=> Removing existing certificates...');
  const filesToRemove = [`${certName}-cert.pem`, `${certName}-key.pem`, 'ca.pem'];
  filesToRemove.forEach(file => {
    const filePath = path.join(certDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  // Create a temporary OpenSSL config file for SAN with corrected keyUsage
  const sslConfig = `
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = ${hostname}

[v3_req]
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${hostname}
IP.1 = ${hostIp}
`;
  const configPath = path.join(certDir, 'openssl.cnf');
  fs.writeFileSync(configPath, sslConfig);

  console.log('=> Generating new certificates with OpenSSL (including SAN)...');
  try {
    execSync(`openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout "${path.join(certDir, `${certName}-key.pem`)}" \
      -out "${path.join(certDir, `${certName}-cert.pem`)}" \
      -config "${configPath}"`, { stdio: 'inherit' });
    
    const certContent = fs.readFileSync(path.join(certDir, `${certName}-cert.pem`));
    fs.writeFileSync(path.join(certDir, 'ca.pem'), certContent);
    
    // Clean up the temporary config file
    fs.unlinkSync(configPath);

    console.log('--- Certificate Generation Complete ---');
  } catch (error) {
    console.error('Error generating certificates:', error.message);
    process.exit(1);
  }
}

function runPrivilegedTasks() {
  console.log('\n--- Running Privileged Host Configuration ---');
  addToHosts();
  trustCa();
  clearOsSslCache();
  console.log('\n--- Host Configuration Finished ---');
}

// --- Script Entry Point ---

const isElevatedRun = process.argv.includes('--elevated');

if (isElevatedRun) {
  runPrivilegedTasks();
} else {
  generateCertificates();

  const options = { name: 'Badminton Court Setup' };
  const command = `node "${__filename}" --elevated`;

  console.log('\n--- Requesting Administrator Privileges ---');
  console.log('A UAC prompt will appear to configure your system. Please approve it.');

  sudo.exec(command, options, (error, stdout, stderr) => {
    if (error) {
      console.error('✖ Failed to gain administrator privileges or an error occurred.');
      console.error(error.message);
      return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('\n✅ All system configuration tasks completed successfully!');
    console.log('\n🎉 FINAL STEP:');
    console.log('If you still see a "Not Secure" warning in Chrome, it\'s due to a cached security policy.');
    console.log('Please do this one last thing:');
    console.log('  1. Copy and paste this link into your Chrome address bar and press Enter:');
    console.log('     chrome://net-internals/#hsts');
    console.log('  2. Type "mail-test" in the "Delete domain security policies" section and click Delete.');
    console.log('  3. Then navigate to: https://mail-test:8443');
  });
}