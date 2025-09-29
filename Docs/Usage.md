# Running Tests - Usage.md
## Run all tests
```powershell
npm run test:e2e
```

## Or directly
```powershell
./scripts/test-runner.sh
```

## Run Cypress tests in interactive mode
```powershell
npm run cypress:open
```

## Run Cypress tests in headless mode
```powershell
npm run cypress:run
```

# Development
## Start development environment
```powershell
npm run dev
```

## Or directly
```powershell
./scripts/dev-runner.sh
```

## Access the application at http://localhost:8000
## Admin login: admin/password

## Docker Services
## Start only development services
```powershell
npm run docker:dev
```

## Start development and test services
```powershell
npm run docker:test
```

## Run only test services
```powershell
npm run docker:cypress
```

## Stop all services
```powershell
npm run docker:down
```

# Additional Configuration
## 1. Create a .env file
### Create a .env file for environment variables:
```env
DEBUG=1
DATABASE_URL=postgres://postgres:postgres@db:5432/badminton_court
REDIS_URL=redis://redis:6379/0
```

## 2. Update Django Settings
### In badminton_court/settings.py, add support for environment variables:
```python
import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'badminton_court'),
        'USER': os.environ.get('POSTGRES_USER', 'postgres'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'postgres'),
        'HOST': os.environ.get('DB_HOST', 'db'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Redis
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ.get('REDIS_URL', 'redis://redis:6379/1'),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# Celery
CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
```

## 3. Update requirements.txt
### Add python-dotenv to your requirements:
```
python-dotenv==1.0.0
```

## CI/CD Integration
### For CI/CD pipelines (GitHub Actions, GitLab CI, etc.), you can use the following approach:
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
      run: ./scripts/test-runner.sh
    
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