# court_management/components/views/test_verify_user.py

import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()

@csrf_exempt
@require_POST
def test_verify_user(request):
    """
    Verify a user for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
        
        # Find and verify the user
        user = User.objects.get(email=email)
        user.is_active = True
        user.save()
        
        return JsonResponse({'status': 'success', 'message': 'User verified successfully'})
    except User.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    