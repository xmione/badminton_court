# court_management/components/views/debug_check_user.py

import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()

@csrf_exempt
@require_http_methods(["POST"])
def debug_check_user(request):
    """
    Debug endpoint to check if a user exists and their details.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(email=email)
            return JsonResponse({
                'status': 'success',
                'user_exists': True,
                'user_id': user.id,
                'username': user.username,
                'is_active': user.is_active,
                'is_staff': user.is_staff,  # This is the key flag
                'groups': [group.name for group in user.groups.all()]
            })
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'success',
                'user_exists': False
            })
            
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
