# Usage.md - How to run the npm run script commands

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

## Tunnel Environment

### Start tunnel environment
```powershell
npm run tunnel
```

### Start tunnel environment in detached mode
```powershell
npm run tunnel:detached
```

### Stop tunnel services
```powershell
npm run tunnel:stop
```

### Show tunnel logs
```powershell
npm run tunnel:logs
```

### Run tunnel service only
```powershell
npm run tunnel:run
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

## Docker Management

### Build Cypress image
```powershell
npm run docker:build
```

### Build Cypress image without cache
```powershell
npm run docker:build-nocache
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

## Environment Configuration

### Create .env file
Create a `.env` file in the project root:
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

### Create .env.tunnel file
Create a `.env.tunnel` file for tunnel configuration:
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
   npm run tunnel:run
   # Check tunnel logs for URL
   npm run tunnel:logs
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