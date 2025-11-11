# badminton_court/settings/celery.py
"""
Celery configuration
"""

import os
from .base import TIME_ZONE

# Celery Configuration
REDIS_URL = os.getenv('REDIS_URL')

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# These lines are for testing - makes Celery tasks run synchronously
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True