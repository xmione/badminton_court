# badminton_court/settings/base.py
"""
Base Django settings
"""

from pathlib import Path
from urllib.parse import urlparse
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Determine which .env file to load based on environment
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development').lower()

# Load the appropriate .env file based on ENVIRONMENT
if ENVIRONMENT == 'docker':
    env_file = '.env.docker'
else:
    env_file = '.env.dev'

# Load environment variables from the selected .env file
from dotenv import load_dotenv
load_dotenv(BASE_DIR / env_file)

# Site branding
SITE_HEADER = os.getenv('SITE_HEADER', 'Badminton Court')
SITE_TITLE = os.getenv('SITE_TITLE', 'Badminton Court Administration Portal')
SITE_INDEX_TITLE = os.getenv('SITE_INDEX_TITLE', 'Welcome to Badminton Court Administration Portal')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-your-secret-key-here')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# Get the base components
APP_PROTOCOL = os.getenv('APP_PROTOCOL', 'http')
APP_DOMAIN = os.getenv('APP_DOMAIN', 'localhost')
APP_PORT = os.getenv('APP_PORT', '8000')

# Build derived values
APP_BASE_URL = f"{APP_PROTOCOL}://{APP_DOMAIN}"
APP_FULL_URL = f"{APP_BASE_URL}:{APP_PORT}"

# Hosts configuration
allowed_hosts_str = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,web')
ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_str.split(',')]

# Add testserver only when running tests or in DEBUG mode
if DEBUG or os.environ.get('RUNNING_TESTS') == 'true':
    ALLOWED_HOSTS.append('testserver')

# Add ngrok domain patterns as a fallback for free tier
ngrok_domains = ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io']
for domain in ngrok_domains:
    if domain not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(domain)

# CSRF Trusted Origins configuration
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]

# Tunnel configuration
TUNNEL_ENABLED = os.environ.get('TUNNEL_ENABLED', 'false').lower() == 'true'

if TUNNEL_ENABLED:
    tunnel_url = os.getenv('TUNNEL_URL')
    if tunnel_url:
        parsed = urlparse(tunnel_url)
        tunnel_host = parsed.netloc
        origin = f"{parsed.scheme}://{parsed.netloc}"
        
        if tunnel_host and tunnel_host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(tunnel_host)
            print(f"Added {tunnel_host} to ALLOWED_HOSTS")
        
        if origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(origin)
            print(f"Added {origin} to CSRF_TRUSTED_ORIGINS")

# Application definition
INSTALLED_APPS = [
    # Django core apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    
    # Third-party apps
    'django_bootstrap5',  
    'django_celery_beat',
    'django_celery_results',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.facebook',
    'allauth.socialaccount.providers.twitter',
    
    # Local apps
    'court_management',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',  
]

ROOT_URLCONF = 'badminton_court.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'badminton_court.context_processors.app_settings', 
            ],
        },
    },
]

WSGI_APPLICATION = 'badminton_court.wsgi.application'

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files (uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Site Configuration
SITE_ID = 1