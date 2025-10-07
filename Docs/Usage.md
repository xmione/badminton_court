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

## Local Development Environment

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

### Load test data
```powershell
npm run dev:load-data
```

## Docker Development Environment

### Start development environment
```powershell
npm run docker:dev
```

### Start development environment in detached mode
```powershell
npm run docker:dev-detached
```

### Stop development services
```powershell
npm run docker:dev-stop
```

### Show development logs
```powershell
npm run docker:dev-logs
```

## Docker Testing Environment

### Start test environment
```powershell
npm run docker:test
```

### Start test environment in detached mode
```powershell
npm run docker:test-detached
```

### Stop test services
```powershell
npm run docker:test-stop
```

### Show test logs
```powershell
npm run docker:test-logs
```

### Set up test data
```powershell
npm run docker:test-setup
```

## Cypress Testing

### Local Cypress Testing

#### Open Cypress in interactive mode
```powershell
npm run dev:cypress-open
```

#### Run Cypress tests in headless mode
```powershell
npm run dev:cypress-headless
```

#### Run Cypress tests in headed mode
```powershell
npm run dev:cypress-headed
```

#### Create presentation videos
```powershell
npm run dev:cypress-presentation
```

#### Create presentation videos for specific test
```powershell
npm run dev:cypress-presentation-spec
```

### Docker Cypress Testing

#### Start Cypress container
```powershell
npm run docker:cypress-start
```

#### Open Cypress in existing container
```powershell
npm run docker:cypress-open
```

#### Run Cypress tests in existing container
```powershell
npm run docker:cypress-run
```

#### Stop Cypress container
```powershell
npm run docker:cypress-stop
```

#### Run Cypress tests in new container (headed)
```powershell
npm run docker:cypress-run-headed
```

#### Run Cypress tests in new container (headless)
```powershell
npm run docker:cypress-run-headless
```

#### Create presentation videos in Docker
```powershell
npm run docker:cypress-presentation
```

#### Process videos in Docker
```powershell
npm run docker:post-process-videos
```

## Tunnel Environment

### Local Tunnel
```powershell
npm run dev:tunnel
```

### Docker Tunnel Environment

#### Start tunnel environment
```powershell
npm run docker:tunnel
```

#### Start tunnel environment in detached mode
```powershell
npm run docker:tunnel-detached
```

#### Stop tunnel services
```powershell
npm run docker:tunnel-stop
```

#### Show tunnel logs
```powershell
npm run docker:tunnel-logs
```

## Docker Management

### Build Docker images
```powershell
npm run docker:build
```

### Build Docker images without cache
```powershell
npm run docker:build-nocache
```

### Stop all services
```powershell
npm run docker:down-volumes
```

### Clean up unused Docker resources
```powershell
npm run docker:prune
```

### Reset environment
```powershell
npm run docker:reset
```

### Reset environment (keeping images)
```powershell
npm run docker:reset-keep-images
```

### Reset and restart all services
```powershell
npm run docker:reset-and-restart
```

## Utility Commands

### Show service status
```powershell
npm run status
```

### Show all logs
```powershell
npm run docker:logs
```

### Open shell in container
```powershell
npm run shell
```

### Access PostgreSQL
```powershell
npm run psql
```

### Print project folder structure
```powershell
npm run pfs
```

### Create SSL certificates
```powershell
npm run certs:create
```

### Encrypt environment files
```powershell
npm run encryptenvfiles
```

### Decrypt environment files
```powershell
npm run decryptenvfiles
```

## Application Access

### Access the application
- Local development: http://localhost:8000
- Docker development: http://localhost:8000
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
      run: npm run docker:cypress-run-headless
    
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
   npm run docker:down-volumes
   npm run dev
   ```

2. **Cypress tests failing**
   ```powershell
   npm run docker:build
   npm run docker:test-setup
   npm run docker:cypress-run-headed
   ```

3. **Tunnel not accessible**
   ```powershell
   npm run docker:tunnel
   # Check tunnel logs for URL
   npm run docker:tunnel-logs
   ```

4. **Database connection issues**
   ```powershell
   npm run docker:test-setup
   npm run docker:logs db
   ```

### Getting Help

- Check logs: `npm run docker:logs`
- Check service status: `npm run status`
- Reset environment: `npm run docker:reset`
- Open shell in container: `npm run shell web`
------------------------------------- NOTHING FOLLOWS ---------------------------------