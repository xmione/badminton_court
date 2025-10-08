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

### Create .env.docker file
Create a `.env.docker` file for Docker configuration:
```env
# Application Configuration
DEBUG=true
DOCKER=true

# Application base URL settings
APP_PROTOCOL=http
APP_DOMAIN=localhost
APP_PORT=8000

# Django Configuration
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgres://dbuser:password@db:5432/badminton_court
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
POSTGRES_PASSWORD=password
POSTGRES_HOST=db
POSTGRES_PORT=5432

# MariaDB Configuration (for Postal)
MYSQL_ROOT_PASSWORD=password
MYSQL_DATABASE=postal
MYSQL_USER=postal
MYSQL_PASSWORD=password

# Postal Configuration
POSTAL_HOST=localhost
POSTAL_PORT=5000
POSTRAL_DB_HOST=mariadb
POSTAL_DB_PORT=3306
POSTAL_DB_USER=postal
POSTAL_DB_PASS=password
POSTAL_DB_NAME=postal
MSG_DB_HOST=mariadb
MSG_DB_PORT=3306
MSG_DB_USER=postal
MSG_DB_PASS=password
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
ADMIN_PASSWORD=password

# Support Configuration
SUPPORT_EMAIL=support@example.com

# Social Media Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
```

## Dependencies

### Python Dependencies
Add to your requirements.txt:
```
python-dotenv==16.0.3
dj-database-url==2.0.0
pyngrok=7.1.6
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

### Start tunnel service locally
```powershell
npm run dev:tunnel
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

## Docker Tunnel Environment

### Start tunnel environment
```powershell
npm run docker:tunnel
```

### Start tunnel environment in detached mode
```powershell
npm run docker:tunnel-detached
```

### Stop tunnel services
```powershell
npm run docker:tunnel-stop
```

### Show tunnel logs
```powershell
npm run docker:tunnel-logs
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

#### Select and run a test for presentation
```powershell
npm run dev:select-presentation
```

#### Post-process existing videos
```powershell
npm run dev:post-process-videos
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
npm run docker:create-presentation
```

#### Process videos in Docker
```powershell
npm run docker:post-process-videos
```

#### Run Cypress tests for presentation spec in Docker
```powershell
npm run docker:cypress-presentation-spec
```

## Docker Management

### Build all Docker images
```powershell
npm run docker:build
```

### Build all Docker images without cache
```powershell
npm run docker:build-nocache
```

### Build specific profile images
```powershell
npm run docker:build-dev
npm run docker:build-test
npm run docker:build-tunnel
npm run docker:build-presentation
```

### Rebuild all services
```powershell
npm run docker:rebuild
```

### Rebuild specific profile services
```powershell
npm run docker:rebuild-dev
npm run docker:rebuild-test
npm run docker:rebuild-tunnel
npm run docker:rebuild-presentation
```

### Stop all services and remove volumes
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

## Docker Image Backup and Restore

### Backup all Docker images
```powershell
npm run docker:backup-images
```
This command creates a single tarball containing all Docker images and saves it to the `./backups` directory.

### Restore all Docker images
```powershell
npm run docker:restore-images
```
This command restores all Docker images from the backup tarball.

### Backup individual Docker images
```powershell
npm run docker:backup-individual
```
This command creates separate tarballs for each Docker image and saves them to the `./backups` directory.

### Restore a specific Docker image
```powershell
npm run docker:restore-image <image-name>
```
Replace `<image-name>` with the name of the image you want to restore (e.g., `web`, `postal`, `celery`, etc.).

### List available backups
```powershell
npm run docker:list-backups
```
This command lists all available image backups in the `./backups` directory.

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
- Through tunnel: https://your-ngrok-subdomain.ngrok-free.dev (when tunnel is running)

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
    
    - name: Build Docker images
      run: npm run docker:build
    
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

5. **Environment variable warnings**
   ```powershell
   # Make sure all required variables are set in .env.docker
   # Check for typos in variable names
   ```

6. **Docker image backup/restore issues**
   ```powershell
   # Check if images exist
   docker images | findstr "badminton_court"
   
   # List available backups
   npm run docker:list-backups
   
   # Try individual backup/restore
   npm run docker:backup-individual
   npm run docker:restore-image web
   ```

### Getting Help

- Check logs: `npm run docker:logs`
- Check service status: `npm run status`
- Reset environment: `npm run docker:reset`
- Open shell in container: `npm run shell web`
------------------------------------- NOTHING FOLLOWS ---------------------------------