// Scripts/pfs.js
// Print project folder structure

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function printFolderStructure() {
  // Get the script's directory to determine project root
  const scriptPath = process.argv[1] || __dirname;
  let projectRoot;
  
  if (scriptPath) {
    // Get the directory containing the script (i.e., "Scripts")
    const scriptDir = path.dirname(scriptPath);
    // Then get its parent (i.e., project root)
    projectRoot = path.dirname(scriptDir);
  } else {
    // Fallback to current directory
    projectRoot = process.cwd();
  }
  
  console.log(`Project root is: ${projectRoot}`);
  
  const excludeFolders = [
    'dist',
    '.next',
    '.github',
    'node_modules',
    '__pycache__',
    'court_management/__pycache__',
    'court_management/management/commands/__pycache__',
    'court_management/templates/__pycache__',
    'venv'
  ];
  
  // Create exclude arguments for the tree command
  const excludeArgs = excludeFolders.map(folder => `-I '${folder}'`).join(' ');
  
  try {
    // Use tree if available, otherwise fallback to ls
    try {
      execSync('tree --version', { stdio: 'pipe' });
      execSync(`tree ${projectRoot} ${excludeArgs} -L 3 > folderstructure.txt`, { stdio: 'pipe' });
      console.log('Folder structure saved to folderstructure.txt');
    } catch (error) {
      // Fallback to ls command
      execSync(`ls -la ${projectRoot} ${excludeArgs} | head -n 50 > folderstructure.txt`, { stdio: 'pipe' });
      console.log('Folder structure saved to folderstructure.txt');
    }
  } catch (error) {
    console.error('ERROR: Failed to generate folder structure:', error.message);
    }
}

printFolderStructure();