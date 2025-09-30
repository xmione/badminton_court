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
   # Create .env file
   cat > .env << EOF
   DEBUG=true
   DATABASE_URL=postgres://postgres:postgres@db:5432/badminton_court
   REDIS_URL=redis://redis:6379/0
   ALLOWED_HOSTS=localhost,127.0.0.1,web
   TUNNEL_ENABLED=false
   SECRET_KEY=django-insecure-your-secret-key-here
   CYPRESS_baseUrl=http://web:8000
   CYPRESS_headed=true
   EOF

   # Create .env.tunnel file
   cat > .env.tunnel << EOF
   TUNNEL_SUBDOMAIN=aeropace-portal
   TUNNEL_ENABLED=true
   TUNNEL_URL=https://aeropace-portal.loca.lt
   ALLOWED_HOSTS=localhost,127.0.0.1,web,aeropace-portal.loca.lt
   CYPRESS_baseUrl=https://aeropace-portal.loca.lt
   CYPRESS_headed=true
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
   npm run dev:detached
   ```

6. **Set up test data**
   ```bash
   npm run test:setup
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
   npm run cypress:open
   ```
   - Cypress Test Runner opens in browser
   - Select test files to run interactively
   - Watch tests execute in real-time

2. **Run tests in headed mode**
   ```bash
   npm run test:booking-headed
   ```
   - Browser window opens showing test execution
   - Visual debugging of test steps
   - Screenshots and videos recorded

3. **Run tests in headless mode**
   ```bash
   npm run test:booking
   ```
   - Tests run in background without browser UI
   - Suitable for automated testing
   - Results in command line

4. **Run all tests**
   ```bash
   npm run test:e2e
   ```
   - Executes all end-to-end tests
   - Generates comprehensive test report
   - Records videos for all tests

5. **Debug specific tests**
   ```bash
   npm run test:payment-debug
   ```
   - Runs debug version of payment tests
   - Provides detailed logging
   - Takes screenshots for manual inspection

---

## Scenario 3: Using LocalTunnel for External Testing

### Objective: Test the application externally using LocalTunnel

#### Prerequisites
- Local Development Setup completed
- py-localtunnel installed (`pip install py-localtunnel`)

#### Steps

1. **Start development environment**
   ```bash
   npm run dev:detached
   ```

2. **Start LocalTunnel**
   ```bash
   npm run docker-tunnel:run
   ```
   - Tunnel service starts
   - Outputs tunnel URL (e.g., https://aeropace-portal.loca.lt)
   - Note the URL for external access

3. **Verify tunnel accessibility**
   ```bash
   # Check tunnel logs
   npm run docker-tunnel:logs
   
   # Access the application via tunnel URL in browser
   # Verify admin login works
   ```

4. **Run tests against tunnel**
   ```bash
   npm run test:tunnel
   ```
   - Tests run against the tunnel URL
   - Simulates external user access
   - Validates external configuration

5. **Test external features**
   ```bash
   # Run specific tests in headed mode against tunnel
   CYPRESS_baseUrl=https://aeropace-portal.loca.lt npm run test:admin-login-headed
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
   # Create production .env file
   cat > .env.prod << EOF
   DEBUG=false
   DATABASE_URL=postgres://user:password@prod-db:5432/badminton_court_prod
   REDIS_URL=redis://prod-redis:6379/0
   ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   SECRET_KEY=your-production-secret-key
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
   docker-compose --profile prod up -d
   ```

4. **Run production tests**
   ```bash
   # Run tests against production configuration
   CYPRESS_baseUrl=https://yourdomain.com npm run test:e2e
   ```

5. **Validate production setup**
   ```bash
   # Check all services are running
   npm run status
   
   # Verify HTTPS and security headers
   curl -I https://yourdomain.com
   
   # Test all critical user flows
   npm run test:booking-headed
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
         run: npm run test:detached
         env:
           COMPOSE_DOCKER_CLI_BUILD: 1
       
       - name: Set up test data
         run: npm run test:setup
       
       - name: Run Cypress tests
         run: npm run test:e2e
       
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
         run: npm run test:stop
   ```

2. **Test pipeline locally**
   ```bash
   # Act as if we're in CI
   export CI=true
   
   # Clean build
   npm run docker:build-nocache
   
   # Run tests
   npm run test:e2e
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
   npm run dev:detached
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
   npm run logs:web
   
   # Monitor database performance
   npm run logs:db
   
   # Check Redis usage
   npm run logs:redis
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
   npm run dev:detached
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
   npm run test:admin-login-headed
   
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

## Troubleshooting Common Issues

### Issue: Docker containers not starting
**Solution:**
```bash
# Check Docker status
docker --version

# Reset Docker environment
npm run reset

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
npm run test:booking-headed
```

### Issue: Tunnel not accessible
**Solution:**
```bash
# Check tunnel logs
npm run docker-tunnel:logs

# Restart tunnel
npm run docker-tunnel:stop
npm run docker-tunnel:run

# Verify ALLOWED_HOSTS configuration
```

### Issue: Database connection issues
**Solution:**
```bash
# Check database logs
npm run logs:db

# Reset database
npm run test:setup

# Verify database URL in .env
```

### Issue: Cypress tests not finding elements
**Solution:**
```bash
# Run in interactive mode
npm run cypress:open

# Use debugging test
npm run test:payment-debug

# Check screenshots and videos
ls cypress/screenshots/
ls cypress/videos/
```