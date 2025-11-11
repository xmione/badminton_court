# badminton_court/settings/security.py
"""
Security and authentication configuration
"""

import os
import re
from django.core.exceptions import ValidationError
from .base import DEBUG

# Authentication Configuration
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'badminton_court.settings.security.CustomPasswordValidator',
    }
]

# Custom password validator
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

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# If in production and DEBUG is False, add these security settings:
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True

# Admin user settings
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL')
ADMIN_FIRST_NAME = os.getenv('ADMIN_FIRST_NAME')
ADMIN_LAST_NAME = os.getenv('ADMIN_LAST_NAME')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD')

# Test user settings
SUPERADMIN_EMAIL = os.getenv('SUPERADMIN_EMAIL')
SUPERADMIN_PASSWORD = os.getenv('SUPERADMIN_PASSWORD')
STAFF_ADMIN_EMAIL = os.getenv('STAFF_ADMIN_EMAIL')
STAFF_ADMIN_PASSWORD = os.getenv('STAFF_ADMIN_PASSWORD')
INACTIVE_ADMIN_EMAIL = os.getenv('INACTIVE_ADMIN_EMAIL')
INACTIVE_ADMIN_PASSWORD = os.getenv('INACTIVE_ADMIN_PASSWORD')

# Support email
SUPPORT_EMAIL = os.getenv('SUPPORT_EMAIL')
DOMAIN_NAME = os.getenv('DOMAIN_NAME')