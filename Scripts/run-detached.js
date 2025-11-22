// Scripts/run-detached.js
const { spawn } = require('child_process');
const path = require('path');

// Function to run Django server in background
function runDetached() {
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    // Windows: Use start /B
    spawn('start', ['/B', 'python', 'manage.py', 'runserver', '0.0.0.0:8000'], {
      detached: true,
      stdio: 'ignore',
      shell: true
    });
  } else {
    // Unix/Linux/macOS: Use nohup
    spawn('nohup', [
      'python', 'manage.py', 'runserver', '0.0.0.0:8000',
      '>', 'server.log', '2>&1', '&'
    ], {
      detached: true,
      stdio: 'ignore',
      shell: true
    });
  }
  
  console.log('Django server started in detached mode');
  console.log('Check server.log for output');
}

runDetached();