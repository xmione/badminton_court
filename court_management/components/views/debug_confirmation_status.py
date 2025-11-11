# court_management/components/views/debug_confirmation_status.py

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()

@csrf_exempt
def debug_confirmation_status(request, token):
    """
    Debug endpoint to check if a confirmation token is valid.
    Only available in DEBUG mode.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        from allauth.account.models import EmailConfirmation
        from django.utils import timezone
        
        # Try to find the confirmation
        try:
            confirmation = EmailConfirmation.objects.get(key=token)
            
            # Check if it's expired
            is_expired = confirmation.key_expired()
            
            return JsonResponse({
                'status': 'success',
                'token_exists': True,
                'token': token,
                'email': confirmation.email_address.email,
                'user_id': confirmation.email_address.user.id,
                'created': confirmation.created.isoformat(),
                'sent': confirmation.sent.isoformat() if confirmation.sent else None,
                'is_expired': is_expired,
                'email_verified': confirmation.email_address.verified,
                'current_time': timezone.now().isoformat()
            })
        except EmailConfirmation.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'token_exists': False,
                'token': token,
                'message': 'Confirmation token not found in database'
            })
            
    except Exception as e:
        import traceback
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'trace': traceback.format_exc()
        }, status=500)
    