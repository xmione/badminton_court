# court_management/components/views/test_set_user_staff.py

import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()

@csrf_exempt
@require_http_methods(["POST"])
def test_set_user_staff(request):
    """
    Set the is_staff flag for a user for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        is_staff = data.get('is_staff', True)
        
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(email=email)
            user.is_staff = is_staff
            user.save()
            
            return JsonResponse({
                'status': 'success',
                'message': f'User {email} is_staff flag set to {is_staff}'
            })
        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'User not found'}, status=404)
            
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
