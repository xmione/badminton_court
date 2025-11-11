# court_management/components/views/update_site_domain.py
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.sites.models import Site
from django.core.cache import cache
from allauth.socialaccount.models import SocialApp
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
        port = data.get('port', '')
        name = data.get('name')
        
        if not domain or not name:
            return JsonResponse({
                'error': 'Both domain and name are required'
            }, status=400)
        
        # Include port in domain if provided and not already included
        if port and f":{port}" not in domain:
            full_domain = f"{domain}:{port}"
        else:
            full_domain = domain
        
        # Get the current site before update
        try:
            current_site = Site.objects.get(id=settings.SITE_ID)
            was_created = False
        except Site.DoesNotExist:
            current_site = None
            was_created = True
        
        # Get or create the site with the configured SITE_ID
        site, created = Site.objects.get_or_create(
            id=settings.SITE_ID,
            defaults={
                'domain': full_domain,
                'name': name
            }
        )
        
        # Update if it already existed
        if not created:
            site.domain = full_domain
            site.name = name
            site.save()
        
        # Clear any cache that might be storing site information
        cache.clear()
        
        # Verify the update was successful
        updated_site = Site.objects.get(id=settings.SITE_ID)
        
        # Check if Google SocialApp is properly associated with this site
        google_apps = SocialApp.objects.filter(provider='google')
        google_app_sites = []
        for app in google_apps:
            google_app_sites.extend([s.domain for s in app.sites.all()])
        
        action = 'created' if created or was_created else 'updated'
        
        return JsonResponse({
            'message': f'Site successfully {action}',
            'site_id': site.id,
            'domain': site.domain,
            'full_domain': full_domain,
            'name': site.name,
            'verified_domain': updated_site.domain,
            'google_apps_count': google_apps.count(),
            'google_app_sites': google_app_sites,
            'cache_cleared': True
        }, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)