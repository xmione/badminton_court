# Steps - Scenarios.md

## Scenario 1: Local Development Setup

### Objective: Set up the complete development environment locally

#### Prerequisites
- Docker installed and running
- Node.js and npm installed
- Python and pip installed

#### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/xmione/badminton_court.git
   cd badminton_court
   ```

2. **Create environment files**
   ```bash
   # Create .env.dev file
   cat > .env.dev << EOF
   DEBUG=true
   DATABASE_URL=postgres://postgres:postgres@db:5432/badminton_court
   REDIS_URL=redis://redis:6379/0
   ALLOWED_HOSTS=localhost,127.0.0.1,web
   TUNNEL_ENABLED=false
   SECRET_KEY=django-insecure-your-secret-key-here
   CYPRESS_baseUrl=http://web:8000
   CYPRESS_headed=true
   EOF

   # Create .env.docker file
   cat > .env.docker << EOF
   # Application Configuration
   DEBUG=true
   DOCKER=true

   # Application base URL settings
   APP_PROTOCOL=http
   APP_DOMAIN=localhost
   APP_PORT=8000

   # Django Configuration
   SECRET_KEY=your-secret-key-here
   DATABASE_URL=postgres://dbuser:yourpassword@db:5432/badminton_court
   REDIS_URL=redis://redis:6379/0
   ALLOWED_HOSTS=localhost,127.0.0.1,web

   # Tunnel Configuration
   NGR_AUTHTOKEN=your-ngrok-auth-token-here
   TUNNEL_ENABLED=false
   TUNNEL_URL=
   CYPRESS_baseUrl=http://localhost:8000
   CYPRESS_headed=true

   # PostgreSQL Configuration
   POSTGRES_DB=badminton_court
   POSTGRES_USER=dbuser
   POSTGRES_PASSWORD=yourpassword
   POSTGRES_HOST=db
   POSTGRES_PORT=5432

   # MariaDB Configuration (for Postal)
   MYSQL_ROOT_PASSWORD=yourpassword
   MYSQL_DATABASE=postal
   MYSQL_USER=postal
   MYSQL_PASSWORD=yourpassword

   # Postal Configuration
   POSTAL_HOST=localhost
   POSTAL_PORT=5000
   POSTRAL_DB_HOST=mariadb
   POSTAL_DB_PORT=3306
   POSTAL_DB_USER=postal
   POSTAL_DB_PASS=yourpassword
   POSTAL_DB_NAME=postal
   MSG_DB_HOST=mariadb
   MSG_DB_PORT=3306
   MSG_DB_USER=postal
   MSG_DB_PASS=yourpassword
   MSG_DB_NAME=postal

   # SMTP Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   SMTP_FROM_NAME=Badminton Court Management

   # Admin Configuration
   ADMIN_EMAIL=admin@example.com
   ADMIN_FIRST_NAME=Admin
   ADMIN_LAST_NAME=User
   ADMIN_PASSWORD=yourpassword

   # Support Configuration
   SUPPORT_EMAIL=support@example.com

   # Social Media Configuration
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FACEBOOK_CLIENT_ID=your-facebook-client-id
   FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
   TWITTER_CLIENT_ID=your-twitter-client-id
   TWITTER_CLIENT_SECRET=your-twitter-client-secret
   EOF
   ```

3. **Install dependencies**
   ```bash
   # Install Node.js dependencies
   npm install

   # Install Python dependencies
   pip install -r requirements.txt
   ```

4. **Build Docker images**
   ```bash
   npm run docker:build
   ```

5. **Start development environment**
   ```bash
   npm run docker:dev-detached
   ```

6. **Set up test data**
   ```bash
   npm run docker:test-setup
   ```

7. **Verify setup**
   ```bash
   # Check service status
   npm run status

   # Access the application
   # Open browser to http://localhost:8000
   # Login with admin/password
   ```

---

## Scenario 2: Running Tests Locally

### Objective: Run end-to-end tests locally in different modes

#### Prerequisites
- Local Development Setup completed
- All services running

#### Steps

1. **Run tests in interactive mode**
   ```bash
   npm run dev:cypress-open
   ```
   - Cypress Test Runner opens in browser
   - Select test files to run interactively
   - Watch tests execute in real-time

2. **Run tests in headed mode**
   ```bash
   npm run dev:cypress-headed
   ```
   - Browser window opens showing test execution
   - Visual debugging of test steps
   - Screenshots and videos recorded

3. **Run tests in headless mode**
   ```bash
   npm run dev:cypress-headless
   ```
   - Tests run in background without browser UI
   - Suitable for automated testing
   - Results in command line

4. **Create presentation videos**
   ```bash
   npm run dev:cypress-presentation
   ```
   - Runs tests with video recording
   - Processes videos to remove Cypress UI
   - Saves to presentation-videos folder

5. **Create presentation videos for specific test**
   ```bash
   npm run dev:cypress-presentation-spec
   ```
   - Runs specific test with video recording
   - Processes videos to remove Cypress UI
   - Useful for focused demonstrations

---

## Scenario 3: Using Ngrok Tunnel for External Testing

### Objective: Test the application externally using Ngrok tunnel

#### Prerequisites
- Local Development Setup completed
- Ngrok auth token configured in .env.docker

#### Steps

1. **Start development environment**
   ```bash
   npm run docker:dev-detached
   ```

2. **Start Ngrok tunnel**
   ```bash
   npm run docker:tunnel
   ```
   - Tunnel service starts
   - Outputs tunnel URL (e.g., https://random-string.ngrok-free.dev)
   - Note the URL for external access

3. **Verify tunnel accessibility**
   ```bash
   # Check tunnel logs
   npm run docker:tunnel-logs
   
   # Access the application via tunnel URL in browser
   # Verify admin login works
   ```

4. **Run tests against tunnel**
   ```bash
   # Update CYPRESS_baseUrl to use tunnel URL
   CYPRESS_baseUrl=https://random-string.ngrok-free.dev npm run dev:cypress-headed
   ```
   - Tests run against the tunnel URL
   - Simulates external user access
   - Validates ALLOWED_HOSTS configuration

5. **Test external features**
   ```bash
   # Run specific tests in headed mode against tunnel
   CYPRESS_baseUrl=https://random-string.ngrok-free.dev npm run dev:cypress-headed
   ```
   - Tests admin login externally
   - Validates ALLOWED_HOSTS configuration
   - Ensures external access works correctly

---

## Scenario 4: Production Deployment Simulation

### Objective: Simulate production deployment and testing

#### Prerequisites
- Local Development Setup completed
- Production-like configuration ready

#### Steps

1. **Prepare production configuration**
   ```bash
   # Create production .env.docker file
   cat > .env.docker.prod << EOF
   # Application Configuration
   DEBUG=false
   DOCKER=true

   # Django Configuration
   SECRET_KEY=your-production-secret-key
   DATABASE_URL=postgres://dbuser:password@db:5432/badminton_court
   REDIS_URL=redis://redis:6379/0
   ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   EOF
   ```

2. **Build production Docker images**
   ```bash
   # Build without cache for clean production build
   npm run docker:build-nocache
   ```

3. **Start production services**
   ```bash
   # Using production profile (if configured)
   docker-compose --env-file .env.docker.prod --profile dev up -d
   ```

4. **Run production tests**
   ```bash
   # Run tests against production configuration
   CYPRESS_baseUrl=https://yourdomain.com npm run docker:cypress-run-headless
   ```

5. **Validate production setup**
   ```bash
   # Check all services are running
   npm run status
   
   # Verify HTTPS and security headers
   curl -I https://yourdomain.com
   
   # Test all critical user flows
   npm run docker:cypress-run-headed
   ```

---

## Scenario 5: CI/CD Pipeline Testing

### Objective: Test the complete CI/CD pipeline

#### Prerequisites
- GitHub repository set up
- GitHub Actions configured
- Docker Hub access (if pushing images)

#### Steps

1. **Set up GitHub Actions workflow**
   ```yaml
   # .github/workflows/ci-cd.yml
   name: CI/CD Pipeline

   on:
     push:
       branches: [ main, develop ]
     pull_request:
       branches: [ main ]

   jobs:
     test:
       runs-on: ubuntu-latest
       
       steps:
       - name: Checkout code
         uses: actions/checkout@v3
       
       - name: Set up Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '18'
       
       - name: Install dependencies
         run: npm install
       
       - name: Build Docker images
         run: npm run docker:build
       
       - name: Start test environment
         run: npm run docker:test-detached
       
       - name: Set up test data
         run: npm run docker:test-setup
       
       - name: Run Cypress tests
         run: npm run docker:cypress-run-headless
       
       - name: Upload Cypress artifacts
         uses: actions/upload-artifact@v3
         if: always()
         with:
           name: cypress-artifacts
           path: |
             cypress/screenshots/
             cypress/videos/
             cypress/reports/
       
       - name: Stop test environment
         if: always()
         run: npm run docker:test-stop
   ```

2. **Test pipeline locally**
   ```bash
   # Act as if we're in CI
   export CI=true
   
   # Clean build
   npm run docker:build-nocache
   
   # Run tests
   npm run docker:cypress-run-headless
   ```

3. **Push and trigger pipeline**
   ```bash
   # Commit and push changes
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   
   # Monitor pipeline in GitHub Actions
   # Check for any failures
   # Review uploaded artifacts
   ```

4. **Validate pipeline results**
   ```bash
   # Download artifacts from GitHub Actions
   # Review test videos and screenshots
   # Check test reports
   # Verify all tests passed
   ```

---

## Scenario 6: Performance and Load Testing

### Objective: Test application performance under load

#### Prerequisites
- Local Development Setup completed
- k6 installed (`brew install k6` or download from https://k6.io)

#### Steps

1. **Prepare load testing script**
   ```javascript
   // load-test.js
   import http from 'k6/http';
   import { check, sleep } from 'k6';

   export let options = {
     stages: [
       { duration: '2m', target: 100 },  // Ramp up to 100 users
       { duration: '5m', target: 100 },  // Stay at 100 users
       { duration: '2m', target: 0 },    // Ramp down
     ],
   };

   export default function () {
     let res = http.get('http://localhost:8000/');
     check(res, {
       'status was 200': (r) => r.status == 200,
     });
     sleep(1);
   }
   ```

2. **Start services**
   ```bash
   npm run docker:dev-detached
   ```

3. **Run load test**
   ```bash
   k6 run load-test.js
   ```
   - Monitor application performance
   - Check for errors or timeouts
   - Review response times

4. **Analyze results**
   ```bash
   # Check logs for any errors
   npm run docker:logs
   
   # Monitor database performance
   npm run docker:logs db
   
   # Check Redis usage
   npm run docker:logs redis
   ```

5. **Optimize based on results**
   - Adjust database queries if slow
   - Add caching if needed
   - Scale services if required
   - Re-run load test to verify improvements

---

## Scenario 7: Security Testing

### Objective: Test application security vulnerabilities

#### Prerequisites
- Local Development Setup completed
- OWASP ZAP installed or access to online version

#### Steps

1. **Start services**
   ```bash
   npm run docker:dev-detached
   ```

2. **Run security tests with OWASP ZAP**
   ```bash
   # Using Docker ZAP
   docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:8000
   ```
   - Scans for common vulnerabilities
   - Generates security report
   - Identifies potential security issues

3. **Test authentication and authorization**
   ```bash
   # Test admin access
   npm run dev:cypress-headed
   
   # Test unauthorized access
   # Manually try accessing admin areas without login
   ```

4. **Validate security headers**
   ```bash
   # Check security headers
   curl -I http://localhost:8000
   
   # Look for headers like:
   # X-Frame-Options
   # X-Content-Type-Options
   # Strict-Transport-Security
   # Content-Security-Policy
   ```

5. **Test input validation**
   ```bash
   # Run tests that try malicious inputs
   # Create test cases for SQL injection, XSS, etc.
   # Verify proper sanitization
   ```

---

## Scenario 8: Creating Presentation Videos

### Objective: Create professional presentation videos from Cypress tests

#### Prerequisites
- Local Development Setup completed
- FFmpeg installed for video processing

#### Steps

1. **Run tests with video recording**
   ```bash
   # Run all tests with video recording
   npm run dev:cypress-presentation
   
   # Run specific test with video recording
   npm run dev:cypress-presentation-spec
   ```

2. **Select specific test for presentation**
   ```bash
   # Interactively select a test to run for presentation
   npm run dev:select-presentation
   ```
   - Interactive menu appears
   - Select test from the list
   - Test runs with video recording
   - Video is automatically processed

3. **Post-process existing videos**
   ```bash
   # Process existing videos to remove Cypress UI
   npm run dev:post-process-videos
   ```
   - Removes Cypress Test Runner sidebar
   - Creates clean presentation videos
   - Generates preview clips

4. **Create presentation videos in Docker**
   ```bash
   # Start Cypress container
   npm run docker:cypress-start
   
   # Run tests with video recording
   npm run docker:cypress-run-headed --config video=true
   
   # Process videos in Docker
   npm run docker:post-process-videos
   ```

5. **Review presentation videos**
   ```bash
   # Check output folder
   ls -la cypress/presentation-videos/
   
   # Play videos to verify quality
   # Check that Cypress UI is properly removed
   ```

---

## Troubleshooting Common Issues

### Issue: Docker containers not starting
**Solution:**
```bash
# Check Docker status
docker --version

# Reset Docker environment
npm run docker:reset

# Check for port conflicts
netstat -an | grep 8000
```

### Issue: Tests failing intermittently
**Solution:**
```bash
# Increase timeouts in Cypress config
# Add explicit waits
# Check for race conditions
# Run tests in headed mode for debugging
npm run dev:cypress-headed
```

### Issue: Tunnel not accessible
**Solution:**
```bash
# Check tunnel logs
npm run docker:tunnel-logs

# Restart tunnel
npm run docker:tunnel-stop
npm run docker:tunnel

# Verify ALLOWED_HOSTS configuration
```

### Issue: Database connection issues
**Solution:**
```bash
# Check database logs
npm run docker:logs db

# Reset database
npm run docker:test-setup

# Verify database URL in .env.docker
```

### Issue: Cypress tests not finding elements
**Solution:**
```bash
# Run in interactive mode
npm run dev:cypress-open

# Run specific test with debugging
npm run dev:cypress-headed

# Check screenshots and videos
ls cypress/screenshots/
ls cypress/videos/
```

### Issue: Video processing fails
**Solution:**
```bash
# Check if FFmpeg is installed
ffmpeg -version

# Install FFmpeg if missing
# For macOS: brew install ffmpeg
# For Ubuntu: sudo apt install ffmpeg

# Check video file permissions
ls -la cypress/videos/

# Run post-processing with verbose output
npm run dev:post-process-videos
```