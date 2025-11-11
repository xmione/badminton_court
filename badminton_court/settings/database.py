# badminton_court/settings/database.py
"""
Database configuration
"""

import os
from .base import BASE_DIR

def get_database_url():
    """
    Returns the appropriate DATABASE_URL based on the environment
    """
    # Check if we're running in Docker environment
    is_docker = os.environ.get('ENVIRONMENT') == 'docker'
    
    # Check if we're running tests (Cypress or docker-compose test profile)
    is_running_tests = (
        os.environ.get('CYPRESS') == 'true' or 
        (is_docker and os.environ.get('CYPRESS'))
    )
    
    if is_running_tests:
        # For test environment, construct URL with db-test (Docker) or localhost (local)
        db_host = 'db-test' if is_docker else 'localhost'
        db_port = '5432'
        db_name = os.getenv('POSTGRES_DB', 'badminton_court_test')
        db_user = os.getenv('POSTGRES_USER', 'dbuser')
        db_password = os.getenv('POSTGRES_PASSWORD', 'dbpass')
        return f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
    else:
        # For development environment, use the standard DATABASE_URL or construct with db
        database_url = os.getenv('DATABASE_URL', 'sqlite:///db.sqlite3')
        if database_url.startswith('postgres'):
            return database_url
        elif database_url == 'sqlite:///db.sqlite3':
            # Default PostgreSQL configuration for dev
            db_name = os.getenv('POSTGRES_DB', 'badminton_court')
            db_user = os.getenv('POSTGRES_USER', 'dbuser')
            db_password = os.getenv('POSTGRES_PASSWORD', 'dbpass')
            db_host = os.getenv('POSTGRES_HOST', 'localhost')
            db_port = os.getenv('POSTGRES_PORT', '5432')
            return f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
        else:
            return database_url

DATABASE_URL = get_database_url()

if DATABASE_URL.startswith('postgres'):
    # PostgreSQL configuration
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
else:
    # SQLite configuration
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }