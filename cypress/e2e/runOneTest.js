// cypress/e2e/runOneTests.js
// To run: node cypress/e2e/runOneTest.js

import inquirer from 'inquirer';
import { exec } from 'child_process';
import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Folder to scan for .feature files
const FEATURE_DIR = path.join(__dirname, 'features', '__generated__');

async function getFeatureFiles() {
  const files = await readdir(FEATURE_DIR);
  return files.filter(file => file.endsWith('.feature'));
}

async function promptUserForTest(files) {
  const choices = files.map(file => ({ name: file, value: file }));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedFile',
      message: 'Select a test to run:',
      choices,
    },
  ]);

  return answers.selectedFile;
}

// async function setEnvVarPowerShell() {
//   return new Promise((resolve, reject) => {
//     const psCommand = `powershell.exe -ExecutionPolicy Bypass -Command "Set-Env-Var -Name 'IS_TESTING' -Value \$true -Target User -Force"`;

//     exec(psCommand, (error, stdout, stderr) => {
//       if (error) {
//         console.error(`❌ PowerShell error:`, stderr);
//         reject(error);
//       } else {
//         console.log(`ℹ️ PowerShell output:\n${stdout}`);
//         resolve();
//       }
//     });
//   });
// }

async function runCypressTest(file) {
  const filePath = `cypress/features/__generated__/${file}`;
  const command = `npx cypress run --spec "${filePath}" --browser chrome --headed`;

  console.log(`\n🚀 Running: ${command}\n`);

  const child = exec(command);

  child.stdout.on('data', data => process.stdout.write(data));
  child.stderr.on('data', data => process.stderr.write(data));
  child.on('exit', code => {
    console.log(`\n✅ Cypress process exited with code ${code}`);
    process.exit(code);
  });
}

async function main() {
  try {
    
    // await setEnvVarPowerShell()
    //   .then(() => console.log('✅ Environment variable IS_TESTING set successfully.'))
    //   .catch(err => console.error('❌ Failed to set environment variable:', err));

    const files = await getFeatureFiles();

    if (files.length === 0) {
      console.log('❌ No .feature files found in:', FEATURE_DIR);
      return;
    }

    const selectedFile = await promptUserForTest(files);
    await runCypressTest(selectedFile);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();