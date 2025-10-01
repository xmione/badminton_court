const { exec } = require('child_process');

function stopServer() {
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    exec('taskkill /F /IM python.exe', (error, stdout, stderr) => {
      if (error) {
        console.error('Error stopping server:', error);
        return;
      }
      console.log('Django server stopped');
    });
  } else {
    exec("pkill -f 'python manage.py runserver'", (error, stdout, stderr) => {
      if (error) {
        console.error('Error stopping server:', error);
        return;
      }
      console.log('Django server stopped');
    });
  }
}

stopServer();