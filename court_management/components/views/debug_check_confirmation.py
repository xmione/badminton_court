# court_management/components/views/debug_check_confirmation.py

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.http import JsonResponse
from django.contrib.auth import get_user_model
User = get_user_model()

@csrf_exempt
@require_http_methods(["POST"])
def debug_check_confirmation(request):
    """
    Debug function to check if email confirmation exists for a user
    """
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        user = User.objects.get(email=email)
        from allauth.account.models import EmailAddress, EmailConfirmation
        
        email_address = EmailAddress.objects.filter(user=user, email=email).first()
        if not email_address:
            return JsonResponse({'status': 'error', 'message': 'Email address not found'})
        
        confirmations = EmailConfirmation.objects.filter(email_address=email_address)
        confirmation_data = []
        for conf in confirmations:
            confirmation_data.append({
                'id': conf.id,
                'created': conf.created.isoformat(),
                'key': conf.key,
                'sent': conf.sent.isoformat() if conf.sent else None,
                'expired': conf.key_expired()
            })
        
        return JsonResponse({
            'status': 'success', 
            'email_address_id': email_address.id,
            'email_verified': email_address.verified,
            'confirmations': confirmation_data
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})
    