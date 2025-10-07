# badminton_court/context_processors.py
from django.conf import settings
import os

def app_settings(request):
    """
    Adds application settings to the template context
    """
    return {
        'APP_BASE_URL': settings.APP_FULL_URL,
        'APP_PROTOCOL': settings.APP_PROTOCOL,
        'APP_DOMAIN': settings.APP_DOMAIN,
        'APP_PORT': settings.APP_PORT,
        'SUPPORT_EMAIL': os.getenv('SUPPORT_EMAIL', 'support@aeropace.com'),
    }