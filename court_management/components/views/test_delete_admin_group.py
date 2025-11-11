# court_management/components/views/test_delete_admin_group.py

import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()



@csrf_exempt
@require_http_methods(["POST"])
def test_delete_admin_group(request):
    """
    Delete an Administrators group for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        from django.contrib.auth.models import Group
        
        # Try to get the Administrators group
        try:
            group = Group.objects.get(name='Administrators')
            group.delete()
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group deleted successfully'
            })
        except Group.DoesNotExist:
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group does not exist'
            })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)
    """
    Delete an Administrators group for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        from django.contrib.auth.models import Group
        
        # Try to get the Administrators group
        try:
            group = Group.objects.get(name='Administrators')
            group.delete()
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group deleted successfully'
            })
        except Group.DoesNotExist:
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group does not exist'
            })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)
  