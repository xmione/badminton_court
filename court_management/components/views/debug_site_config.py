# court_management/components/views/debug_site_config.py

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.contrib.auth import get_user_model
User = get_user_model()

@csrf_exempt
@require_http_methods(["POST"])
def debug_site_config(request):
    """Debug endpoint to check site configuration"""
    from django.contrib.sites.models import Site
    from django.conf import settings
    
    site = Site.objects.get_current()
    
    return JsonResponse({
        'site_id': settings.SITE_ID,
        'site_domain': site.domain,
        'site_name': site.name,
        'default_from_email': settings.DEFAULT_FROM_EMAIL,
        'account_email_subject_prefix': getattr(settings, 'ACCOUNT_EMAIL_SUBJECT_PREFIX', 'Not set'),
    })
