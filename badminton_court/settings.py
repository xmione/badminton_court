# badminton_court/settings.py

"""
Django settings for badminton_court project.
"""

from pathlib import Path
from urllib.parse import urlparse
import os
import re
from django.contrib import admin
from django.core.exceptions import ValidationError, ImproperlyConfigured
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Determine which .env file to load based on environment
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development').lower()

# Load the appropriate .env file based on ENVIRONMENT
if ENVIRONMENT == 'docker':
    env_file = '.env.docker'
else:
    env_file = '.env.dev'

# Load environment variables from the selected .env file
from dotenv import load_dotenv
load_dotenv(env_file)

# Validate critical environment variables
def get_required_env_var(var_name, default=None):
    value = os.getenv(var_name, default)
    if value is None and default is None:
        raise ImproperlyConfigured(f"Required environment variable {var_name} is not set in {env_file}.")
    return value

def get_bool_env_var(var_name, default=False):
    value = os.getenv(var_name, str(default)).lower()
    return value in ['true', '1', 'yes', 'on']

# Critical settings
SECRET_KEY = get_required_env_var('SECRET_KEY')
DEBUG = get_bool_env_var('DEBUG', True)

# Timezone and internationalization
TIME_ZONE = get_required_env_var('TIME_ZONE', 'UTC')
USE_TZ = get_bool_env_var('USE_TZ', True)
LANGUAGE_CODE = 'en-us'
USE_I18N = True

# Site settings
SITE_HEADER = get_required_env_var('SITE_HEADER')
SITE_TITLE = get_required_env_var('SITE_TITLE')
SITE_INDEX_TITLE = get_required_env_var('SITE_INDEX_TITLE')

# Hosts configuration
ALLOWED_HOSTS = [host.strip() for host in get_required_env_var('ALLOWED_HOSTS').split(',')]

# Add ngrok domain patterns
ngrok_domains = ['*.ngrok-free.dev', '*.ngrok-free.app', '*.ngrok.io']
for domain in ngrok_domains:
    if domain not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(domain)

# Application URL settings
APP_PROTOCOL = get_required_env_var('APP_PROTOCOL', 'http')
APP_DOMAIN = get_required_env_var('APP_DOMAIN', 'localhost')
APP_PORT = get_required_env_var('APP_PORT', '8000')
APP_BASE_URL = get_required_env_var('APP_BASE_URL', f'{APP_PROTOCOL}://{APP_DOMAIN}:{APP_PORT}')
APP_FULL_URL = get_required_env_var('APP_FULL_URL', APP_BASE_URL)

# Tunnel configuration
TUNNEL_ENABLED = get_bool_env_var('TUNNEL_ENABLED', False)

# Debug output (only in development)
if DEBUG:
    print(f"ENVIRONMENT: {ENVIRONMENT}")
    print(f"DEBUG: {DEBUG}")
    print(f"TUNNEL_ENABLED: {TUNNEL_ENABLED}")
    print(f"APP_PROTOCOL: {APP_PROTOCOL}")
    print(f"APP_DOMAIN: {APP_DOMAIN}")
    print(f"APP_PORT: {APP_PORT}")
    print(f"APP_BASE_URL: {APP_BASE_URL}")
    print(f"ALLOWED_HOSTS: {ALLOWED_HOSTS}")

# CSRF and Security settings
CSRF_TRUSTED_ORIGINS = [f"{APP_PROTOCOL}://{h}:{APP_PORT}" for h in ALLOWED_HOSTS if ':' not in h]

# Add specific origins from env
csrf_origins = os.getenv('CSRF_TRUSTED_ORIGINS', '')
if csrf_origins:
    CSRF_TRUSTED_ORIGINS.extend([o.strip() for o in csrf_origins.split(',')])

# Add tunnel URL if enabled
if TUNNEL_ENABLED:
    tunnel_url = os.getenv('TUNNEL_URL', '')
    if ENVIRONMENT == 'docker':
        try:
            with open('/app/shared/tunnel_url.txt', 'r') as f:
                tunnel_url = f.read().strip()
            if tunnel_url:
                parsed = urlparse(tunnel_url)
                origin = f"{parsed.scheme}://{parsed.netloc}"
                CSRF_TRUSTED_ORIGINS.append(origin)
                print(f"✓ Added tunnel origin: {origin}")
        except FileNotFoundError:
            print("⚠️ Tunnel URL file not found.")

# Security settings
SECURE_BROWSER_XSS_FILTER = get_bool_env_var('SECURE_BROWSER_XSS_FILTER', True)
SECURE_CONTENT_TYPE_NOSNIFF = get_bool_env_var('SECURE_CONTENT_TYPE_NOSNIFF', True)
X_FRAME_OPTIONS = os.getenv('X_FRAME_OPTIONS', 'DENY')

# Production security
if not DEBUG:
    SESSION_COOKIE_SECURE = get_bool_env_var('SESSION_COOKIE_SECURE', True)
    CSRF_COOKIE_SECURE = get_bool_env_var('CSRF_COOKIE_SECURE', True)
    SECURE_SSL_REDIRECT = get_bool_env_var('SECURE_SSL_REDIRECT', True)
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = get_bool_env_var('SECURE_HSTS_INCLUDE_SUBDOMAINS', True)
    SECURE_HSTS_PRELOAD = get_bool_env_var('SECURE_HSTS_PRELOAD', True)
else:
    # Development settings
    CSRF_COOKIE_DOMAIN = None
    SESSION_COOKIE_DOMAIN = None

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'django_bootstrap5',
    'django_celery_beat',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.facebook',
    'allauth.socialaccount.providers.twitter',
    'court_management',
    'email_management',  # Add email management app
]

# Debug toolbar (development only)
if DEBUG and get_bool_env_var('DEBUG_TOOLBAR_ENABLED', False):
    INSTALLED_APPS.append('debug_toolbar')

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

if DEBUG and get_bool_env_var('DEBUG_TOOLBAR_ENABLED', False):
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')

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

# Database configuration
def get_database_url():
    """Dynamic database URL based on environment and testing status"""
    is_docker = ENVIRONMENT == 'docker'
    is_running_tests = (
        os.environ.get('CYPRESS') == 'true' or
        os.environ.get('TESTING') == 'true' or
        os.getenv('CYPRESS', '').lower() == 'true'
    )
    
    if is_running_tests and is_docker:
        # Use test database for Cypress tests
        return get_required_env_var('TEST_DATABASE_URL', 
                                   f"postgresql://{get_required_env_var('POSTGRES_TEST_USER')}:{get_required_env_var('POSTGRES_TEST_PASSWORD')}@db-test:5432/{get_required_env_var('POSTGRES_TEST_DB')}")
    else:
        # Use main database
        return get_required_env_var('DATABASE_URL')

DATABASE_URL = get_database_url()
DATABASES = {
    'default': dj_database_url.parse(DATABASE_URL)
}

# Test database settings
if is_running_tests:
    DATABASES['default']['TEST'] = {
        'NAME': get_required_env_var('POSTGRES_TEST_DB'),
        'USER': get_required_env_var('POSTGRES_TEST_USER'),
        'PASSWORD': get_required_env_var('POSTGRES_TEST_PASSWORD'),
        'HOST': get_required_env_var('POSTGRES_TEST_HOST', 'db-test'),
        'PORT': get_required_env_var('POSTGRES_TEST_PORT', '5432'),
    }

# Redis/Celery Configuration
REDIS_URL = get_required_env_var('REDIS_URL')
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', REDIS_URL)
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# Cache configuration
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.getenv('CACHES_BACKEND', f"{REDIS_URL}/1"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# Session configuration
SESSION_ENGINE = os.getenv('SESSION_ENGINE', 'django.contrib.sessions.backends.cache')
SESSION_COOKIE_SECURE = get_bool_env_var('SESSION_COOKIE_SECURE', not DEBUG)
CSRF_COOKIE_SECURE = get_bool_env_var('CSRF_COOKIE_SECURE', not DEBUG)

# Static and Media files
STATIC_URL = get_required_env_var('STATIC_URL', '/static/')
STATIC_ROOT = get_required_env_var('STATIC_ROOT', BASE_DIR / 'staticfiles')
STATICFILES_DIRS = [BASE_DIR / 'static'] if (BASE_DIR / 'static').exists() else []

MEDIA_URL = get_required_env_var('MEDIA_URL', '/media/')
MEDIA_ROOT = get_required_env_var('MEDIA_ROOT', BASE_DIR / 'media')

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = get_required_env_var('SMTP_HOST')
EMAIL_PORT = int(get_required_env_var('SMTP_PORT'))
EMAIL_USE_TLS = get_bool_env_var('EMAIL_USE_TLS', True)
EMAIL_HOST_USER = get_required_env_var('EMAIL_HOST_USER', get_required_env_var('NOREPLY_EMAIL'))
EMAIL_HOST_PASSWORD = get_required_env_var('EMAIL_HOST_PASSWORD', get_required_env_var('NOREPLY_PASSWORD'))
DEFAULT_FROM_EMAIL = get_required_env_var('DEFAULT_FROM_EMAIL')

# IMAP configuration (for email processing)
IMAP_HOST = get_required_env_var('IMAP_HOST')
IMAP_PORT = int(get_required_env_var('IMAP_PORT'))
IMAP_USE_SSL = get_bool_env_var('IMAP_USE_SSL', True)
IMAP_USER = get_required_env_var('IMAP_USER', get_required_env_var('ADMIN_EMAIL'))
IMAP_PASSWORD = get_required_env_var('IMAP_PASSWORD', get_required_env_var('ADMIN_PASSWORD'))

# User settings
ADMIN_EMAIL = get_required_env_var('ADMIN_EMAIL')
ADMIN_PASSWORD = get_required_env_var('ADMIN_PASSWORD')
NOREPLY_EMAIL = get_required_env_var('NOREPLY_EMAIL')
NOREPLY_PASSWORD = get_required_env_var('NOREPLY_PASSWORD')
TEST_USER_EMAIL = get_required_env_var('TEST_USER_EMAIL')
TEST_USER_PASSWORD = get_required_env_var('TEST_USER_PASSWORD')

# Allauth Configuration
SITE_ID = 1
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

ACCOUNT_EMAIL_VERIFICATION = os.getenv('ACCOUNT_EMAIL_VERIFICATION', 'mandatory')
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = True
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/accounts/login/'

# Social providers (only if credentials exist)
SOCIALACCOUNT_PROVIDERS = {}
for provider in ['google', 'facebook', 'twitter']:
    client_id = os.getenv(f'{provider.upper()}_CLIENT_ID')
    client_secret = os.getenv(f'{provider.upper()}_CLIENT_SECRET')
    if client_id and client_secret:
        SOCIALACCOUNT_PROVIDERS[provider] = {
            'APP': {
                'client_id': client_id,
                'secret': client_secret,
            }
        }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8}
    },
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
    {'NAME': 'badminton_court.settings.CustomPasswordValidator'},
]

class CustomPasswordValidator:
    def validate(self, password, user=None):
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r'[0-9]', password):
            raise ValidationError("Password must contain at least one digit.")
        if not re.search(r'[^A-Za-z0-9]', password):
            raise ValidationError("Password must contain at least one special character.")
    
    def get_help_text(self):
        return "Your password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters."

# Logging
LOG_LEVEL = get_required_env_var('LOGGING_LEVEL', 'INFO')
LOG_DIR = get_required_env_var('LOG_DIR', BASE_DIR / 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files (Uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Authentication Configuration
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Django Allauth Configuration
ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*', 'password2*']
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'
ACCOUNT_USERNAME_BLACKLIST = ['admin', 'staff', 'root']
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/accounts/login/'
SOCIALACCOUNT_LOGIN_ON_GET = True
SOCIALACCOUNT_EMAIL_VERIFICATION = True
SOCIALACCOUNT_EMAIL_REQUIRED = True
SOCIALACCOUNT_STORE_TOKENS = False

# Site Configuration
SITE_ID = 1

# Social Media Provider Configuration
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
        'APP': {
            'client_id': get_required_env_var('GOOGLE_CLIENT_ID'),
            'secret': get_required_env_var('GOOGLE_CLIENT_SECRET'),
            'key': ''
        }
    },
    'facebook': {
        'METHOD': 'oauth2',
        'SCOPE': ['email', 'public_profile'],
        'AUTH_PARAMS': {'auth_type': 'reauthenticate'},
        'INITIAL_PARAMS': {'cookie': True},
        'FIELDS': [
            'id', 'email', 'name', 'first_name', 'last_name',
            'verified', 'locale', 'timezone', 'link', 'gender', 'updated_time',
        ],
        'VERIFIED_EMAIL': False,
        'APP': {
            'client_id': get_required_env_var('FACEBOOK_CLIENT_ID'),
            'secret': get_required_env_var('FACEBOOK_CLIENT_SECRET'),
            'key': ''
        }
    },
    'twitter': {
        'SCOPE': ['tweet.read', 'users.read'],
        'APP': {
            'client_id': get_required_env_var('TWITTER_CLIENT_ID'),
            'secret': get_required_env_var('TWITTER_CLIENT_SECRET'),
            'key': ''
        }
    }
}

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Production security settings
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True

# Email configuration for Mailcow - now using environment variables
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = get_required_env_var('SMTP_HOST')  # Changed from hardcoded 'postfix-mailcow'
EMAIL_PORT = int(get_required_env_var('SMTP_PORT'))  # Changed from hardcoded 587
EMAIL_USE_TLS = get_required_env_var('EMAIL_USE_TLS').lower() == 'true'
EMAIL_HOST_USER = get_required_env_var('ADMIN_EMAIL')
EMAIL_HOST_PASSWORD = get_required_env_var('ADMIN_PASSWORD')
DEFAULT_FROM_EMAIL = get_required_env_var('NOREPLY_EMAIL')

# IMAP configuration for receiving emails - now using environment variables
IMAP_HOST = get_required_env_var('IMAP_HOST')  # Changed from hardcoded 'dovecot-mailcow'
IMAP_PORT = int(get_required_env_var('IMAP_PORT'))  # Changed from hardcoded 993
IMAP_USE_SSL = get_required_env_var('IMAP_USE_SSL').lower() == 'true'  # Changed from hardcoded True
IMAP_USER = get_required_env_var('ADMIN_EMAIL')
IMAP_PASSWORD = get_required_env_var('ADMIN_PASSWORD')

# Admin user settings
ADMIN_EMAIL = get_required_env_var('ADMIN_EMAIL')
ADMIN_FIRST_NAME = get_required_env_var('ADMIN_FIRST_NAME')
ADMIN_LAST_NAME = get_required_env_var('ADMIN_LAST_NAME')
ADMIN_PASSWORD = get_required_env_var('ADMIN_PASSWORD')

# Support email
SUPPORT_EMAIL = get_required_env_var('SUPPORT_EMAIL')

# Test user settings for Cypress tests
TEST_USER_EMAIL = get_required_env_var('TEST_USER_EMAIL')
TEST_USER_PASSWORD = get_required_env_var('TEST_USER_PASSWORD')
TEST_USER_FIRST_NAME = get_required_env_var('TEST_USER_FIRST_NAME')
TEST_USER_LAST_NAME = get_required_env_var('TEST_USER_LAST_NAME')

# Celery Configuration
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': LOG_LEVEL,
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'level': LOG_LEVEL,
            'class': 'logging.FileHandler',
            'filename': LOG_DIR / 'django.log',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'court_management': {
            'handlers': ['console', 'file'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'email_management': {
            'handlers': ['console', 'file'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'email_management': {
            'handlers': ['console', 'file'],
            'level': get_required_env_var('DJANGO_LOG_LEVEL'),
            'propagate': False,
        },
    },
}

# Default primary key
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Performance settings
if not DEBUG:
    GUNICORN_WORKERS = int(os.getenv('GUNICORN_WORKERS', '2'))
    GUNICORN_THREADS = int(os.getenv('GUNICORN_THREADS', '4'))