# court_management/components/views/update_site_domain.py

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.sites.models import Site
User = get_user_model()

@csrf_exempt
@require_http_methods(["POST"])
def update_site_domain(request):
    """
    API endpoint to update the Site domain and name.
    This is used by Cypress tests to ensure the correct domain is set.
    """
    try:
        data = json.loads(request.body)
        domain = data.get('domain')
        name = data.get('name')
        
        if not domain or not name:
            return JsonResponse({
                'error': 'Both domain and name are required'
            }, status=400)
        
        # Get or create the site with the configured SITE_ID
        site, created = Site.objects.get_or_create(
            id=settings.SITE_ID,
            defaults={
                'domain': domain,
                'name': name
            }
        )
        
        # Update if it already existed
        if not created:
            site.domain = domain
            site.name = name
            site.save()
        
        action = 'created' if created else 'updated'
        
        return JsonResponse({
            'message': f'Site successfully {action}',
            'site_id': site.id,
            'domain': site.domain,
            'name': site.name
        }, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)
    