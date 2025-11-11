# court_management/components/views/check_pending_emails.py

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.http import JsonResponse
from django.contrib.auth import get_user_model
User = get_user_model()


@csrf_exempt
@require_http_methods(["POST"])
def check_pending_emails(request):
    """
    Check for pending verification emails in the database.
    """
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)
        
        # Check django-allauth email confirmations
        from allauth.account.models import EmailAddress, EmailConfirmation
        from django.utils import timezone
        
        emails_data = []
        need_manual_send = False
        
        try:
            user = User.objects.get(email=email)
            email_address = EmailAddress.objects.filter(user=user, email=email).first()
            
            if email_address:
                # Get all confirmations for this email
                confirmations = EmailConfirmation.objects.filter(
                    email_address=email_address
                ).order_by('-created')
                
                for conf in confirmations:
                    emails_data.append({
                        'id': conf.id,
                        'key': conf.key,
                        'created': conf.created.isoformat(),
                        'sent': conf.sent.isoformat() if conf.sent else None,
                        'expired': conf.key_expired(),
                        'email_verified': email_address.verified
                    })
                
                # Check if we need to manually send
                if confirmations and not any(conf.sent for conf in confirmations):
                    need_manual_send = True
                    
        except User.DoesNotExist:
            pass
        
        return JsonResponse({
            'emails': emails_data,
            'need_manual_send': need_manual_send,
            'email_found': len(emails_data) > 0
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
