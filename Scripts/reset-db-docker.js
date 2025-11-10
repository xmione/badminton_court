// Scripts/reset-db-docker.js
// Reset PostgreSQL database in Docker

const { execSync } = require('child_process');
const readline = require('readline');

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

async function resetDatabase() {
  const args = process.argv.slice(2);
  let force = false;
  let migrate = false;
  let loadTestData = false;
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--force' || args[i] === '-f') {
      force = true;
    } else if (args[i] === '--migrate' || args[i] === '-m') {
      migrate = true;
    } else if (args[i] === '--load-test-data' || args[i] === '-l') {
      loadTestData = true;
    }
  }
  
  console.log('Docker Database Reset Script');
  console.log('============================');
  
  // Check if Docker is running
  try {
    execSync('docker info', { stdio: 'pipe' });
  } catch (error) {
    console.error('ERROR: Docker is not running. Please start Docker first.');
    process.exit(1);
  }
  
  // Check if db container is running
  try {
    const dbContainer = execSync('docker ps --filter "name=db" --format "{{.Names}}"', { encoding: 'utf8' }).trim();
    if (!dbContainer) {
      console.error('ERROR: Database container \'db\' is not running.');
      console.log('TIP: Run: npm run docker:dev-detached');
      process.exit(1);
    }
  } catch (error) {
    console.error('ERROR: Failed to check database container:', error.message);
    process.exit(1);
  }
  
  if (!force) {
    console.log('');
    console.log('WARNING: This will DELETE ALL DATA in the database!');
    const response = await ask('Are you sure you want to reset the database? (y/N): ');
    if (response.toLowerCase() !== 'y' && response.toLowerCase() !== 'yes') {
      console.log('Database reset cancelled.');
      process.exit(0);
    }
  }
  
  console.log('');
  console.log('Dropping existing database...');
  try {
    execSync('docker exec -i db psql -U dbuser -d postgres -c "DROP DATABASE IF EXISTS badminton_court;"', { stdio: 'pipe' });
    console.log('SUCCESS: Database dropped');
  } catch (error) {
    console.error('ERROR: Failed to drop database:', error.message);
    process.exit(1);
  }
  
  console.log('');
  console.log('Creating fresh database...');
  try {
    execSync('docker exec -i db psql -U dbuser -d postgres -c "CREATE DATABASE badminton_court OWNER dbuser;"', { stdio: 'pipe' });
    console.log('SUCCESS: Database created');
  } catch (error) {
    console.error('ERROR: Failed to create database:', error.message);
    process.exit(1);
  }
  
  if (migrate) {
    console.log('');
    console.log('Running database migrations...');
    try {
      execSync('docker-compose --env-file .env.docker --profile dev exec -T web-dev python manage.py migrate', { stdio: 'pipe' });
      console.log('SUCCESS: Migrations completed');
    } catch (error) {
      console.error('ERROR: Failed to run migrations:', error.message);
      process.exit(1);
    }
    
    if (loadTestData) {
      console.log('');
      console.log('Loading test data...');
      try {
        execSync('docker-compose --env-file .env.docker --profile dev exec -T web-dev python manage.py load_test_data', { stdio: 'pipe' });
        console.log('SUCCESS: Test data loaded');
      } catch (error) {
        console.error('WARNING: Failed to load test data:', error.message);
      }
    }
    
    console.log('');
    console.log('Database reset and migration completed!');
  } else {
    console.log('');
    console.log('Database reset completed!');
    console.log('TIP: Run with --migrate flag to apply migrations');
    console.log('     Example: node reset-db-docker.js --migrate');
    console.log('     Example: node reset-db-docker.js --migrate --load-test-data');
  }
  
  console.log('');
}

resetDatabase();