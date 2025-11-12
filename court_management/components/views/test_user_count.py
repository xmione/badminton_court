# court_management/views/test_user_count.py

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

@csrf_exempt
@require_GET
def test_user_count(request):
    """
    Get user count for validation purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({
            'status': 'error', 
            'message': 'Only available in debug mode'
        }, status=403)
    
    try:
        user_count = User.objects.count()
        active_count = User.objects.filter(is_active=True).count()
        staff_count = User.objects.filter(is_staff=True).count()
        superuser_count = User.objects.filter(is_superuser=True).count()
        
        return JsonResponse({
            'status': 'success',
            'count': user_count,
            'active': active_count,
            'staff': staff_count,
            'superuser': superuser_count
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)