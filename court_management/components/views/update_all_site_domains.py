# court_management/components/views/update_all_site_domains.py

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.http import JsonResponse
from django.contrib.auth import get_user_model
User = get_user_model()

@csrf_exempt
@require_http_methods(["POST"])
def update_all_site_domains(request):
    """
    Update ALL Site objects in the database to ensure django-allauth uses the correct domain.
    """
    try:
        data = json.loads(request.body)
        domain = data.get('domain')
        name = data.get('name')
        
        if not domain or not name:
            return JsonResponse({
                'error': 'Both domain and name are required'
            }, status=400)
        
        # Update ALL Site objects, not just the one with SITE_ID
        from django.contrib.sites.models import Site
        sites = Site.objects.all()
        updated_count = 0
        
        for site in sites:
            site.domain = domain
            site.name = name
            site.save()
            updated_count += 1
        
        # Also update the default site if no sites exist
        if updated_count == 0:
            Site.objects.create(domain=domain, name=name)
            updated_count = 1
        
        return JsonResponse({
            'message': f'All {updated_count} site domain(s) updated successfully',
            'updated_count': updated_count,
            'domain': domain,
            'name': name
        }, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)
    