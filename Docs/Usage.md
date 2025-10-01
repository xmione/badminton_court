# Usage.md - How to run the npm run script commands

## Environment Configuration

### Create .env.dev file
Create a `.env.dev` file in the project root:
```env
DEBUG=true
DATABASE_URL=postgres://postgres:postgres@db:5432/badminton_court
REDIS_URL=redis://redis:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1,web
TUNNEL_ENABLED=false
SECRET_KEY=django-insecure-your-secret-key-here
CYPRESS_baseUrl=http://web:8000
CYPRESS_headed=true
```

### Create .env.dev.tunnel file
Create a `.env.dev.tunnel` file for tunnel configuration:
```env
TUNNEL_SUBDOMAIN=aeropace-portal
TUNNEL_ENABLED=true
TUNNEL_URL=https://aeropace-portal.loca.lt
ALLOWED_HOSTS=localhost,127.0.0.1,web,aeropace-portal.loca.lt
CYPRESS_baseUrl=https://aeropace-portal.loca.lt
CYPRESS_headed=true
```

## Dependencies

### Python Dependencies
Add to your requirements.txt:
```
python-dotenv==16.0.3
dj-database-url==2.0.0
```

### Node.js Dependencies
Already included in package.json:
```json
{
  "devDependencies": {
    "cypress": "^15.3.0",
    "dotenv": "^17.2.3"
  }
}
```

## Development Environment

### Start development environment
```powershell
npm run dev
```

### Start development environment in detached mode
```powershell
npm run dev:detached
```

### Stop development services
```powershell
npm run dev:stop
```

### Show development logs
```powershell
npm run dev:logs
```

## Testing Environment

### Start test environment
```powershell
npm run test

# Run any test file
npm run test:spec cypress/e2e/booking/booking.cy.js
npm run test:spec cypress/e2e/admin/admin-login.cy.js

# Run any test file in headed mode
npm run test:spec-headed cypress/e2e/booking/booking.cy.js
```

### Start test environment in detached mode
```powershell
npm run test:detached
```

### Stop test services
```powershell
npm run test:stop
```

### Show test logs
```powershell
npm run test:logs
```

### Set up test data
```powershell
npm run test:setup
```

## Cypress Testing

### Open Cypress in interactive mode
```powershell
npm run cypress:open
```

### Run Cypress tests in headless mode
```powershell
npm run cypress:run
```

### Run Cypress tests in headed mode
```powershell
npm run cypress:run-headed
```

### Run all E2E tests
```powershell
npm run test:e2e
```

### Run all tests
```powershell
npm run test:all
```

### Run booking tests
```powershell
npm run test:booking
```

### Run booking tests in headed mode
```powershell
npm run test:booking-headed
```

### Run admin login tests
```powershell
npm run test:admin-login
```

### Run admin login tests in headed mode
```powershell
npm run test:admin-login-headed
```

### Run admin login tests in interactive mode
```powershell
npm run test:admin-login-interactive
```

### Run payment debug tests
```powershell
npm run test:payment-debug
```

### Run connectivity tests
```powershell
npm run test:connectivity
```

### Run headers tests
```powershell
npm run test:headers
```

### Run tests against tunnel
```powershell
npm run test:tunnel
```

## Tunnel Environment

### Start tunnel environment
```powershell
npm run docker-tunnel
```

### Start tunnel environment in detached mode
```powershell
npm run docker-tunnel:detached
```

### Stop tunnel services
```powershell
npm run docker-tunnel:stop
```

### Show tunnel logs
```powershell
npm run docker-tunnel:logs
```

### Run tunnel service only
```powershell
npm run docker-tunnel:run
```

## Docker Management

### Build Cypress image
```powershell
npm run docker:build

# Build any service
npm run docker:build web
npm run docker:build db
npm run docker:build cypress
```

### Build Cypress image without cache
```powershell
npm run docker:build-nocache

# Build any service with no cache
npm run docker:build-nocache web
npm run docker:build-nocache db

# Build Cypress specifically (with profile)
npm run docker:build-cypress
npm run docker:build-cypress-nocache

# Logs for any service
npm run docker:logs web
npm run docker:logs-service web

# Shell for any service
npm run docker:shell web bash
npm run docker:shell-service web bash
```

### Stop all services
```powershell
npm run docker:down
```

### Stop all services and remove volumes
```powershell
npm run docker:down-volumes
```

### Clean up unused Docker resources
```powershell
npm run docker:prune
```

## Utility Commands

### General Commands
```powershell
# Logs for any service
npm run logs web
npm run logs-service web

# Shell for any service
npm run shell web bash
```

### Show all logs
```powershell
npm run logs
```

### Show web service logs
```powershell
npm run logs:web
```

### Show database logs
```powershell
npm run logs:db
```

### Show Redis logs
```powershell
npm run logs:redis
```

### Show Celery logs
```powershell
npm run logs:celery
```

### Show Celery Beat logs
```powershell
npm run logs:celery-beat
```

### Show service status
```powershell
npm run status
```

### Open shell in web container
```powershell
npm run shell:web
```

### Open shell in database container
```powershell
npm run shell:db
```

### Open shell in Redis container
```powershell
npm run shell:redis
```

### Reset entire environment
```powershell
npm run reset
```

## Application Access

### Access the application
- Local development: http://localhost:8000
- Through tunnel: https://aeropace-portal.loca.lt (when tunnel is running)

### Admin Login
- Username: admin
- Password: password

## CI/CD Integration

### GitHub Actions Example
```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Run tests
      run: npm run test:e2e
    
    - name: Upload Cypress screenshots
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: cypress-screenshots
        path: cypress/screenshots/
        
    - name: Upload Cypress videos
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: cypress-videos
        path: cypress/videos/
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```powershell
   npm run docker:down
   npm run dev
   ```

2. **Cypress tests failing**
   ```powershell
   npm run docker:build
   npm run test:setup
   npm run test:booking-headed
   ```

3. **Tunnel not accessible**
   ```powershell
   npm run docker-tunnel:run
   # Check tunnel logs for URL
   npm run docker-tunnel:logs
   ```

4. **Database connection issues**
   ```powershell
   npm run test:setup
   npm run logs:db
   ```

### Getting Help

- Check logs: `npm run logs`
- Check service status: `npm run status`
- Reset environment: `npm run reset`
- Open shell in container: `npm run shell:web`
------------------------------------- NOTHING FOLLOWS ---------------------------------