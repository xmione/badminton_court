# court_management/components/views/send_pending_emails.py

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.http import JsonResponse
from django.contrib.auth import get_user_model
User = get_user_model()

@csrf_exempt
@require_http_methods(["POST"])
def send_pending_emails(request):
    """
    Manually send pending verification emails.
    """
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)
        
        # Import django-allauth utilities
        from allauth.account.models import EmailAddress, EmailConfirmation
        from allauth.account import app_settings as account_settings
        from allauth.account.adapter import get_adapter
        from django.utils import timezone
        
        try:
            user = User.objects.get(email=email)
            email_address = EmailAddress.objects.filter(user=user, email=email).first()
            
            if not email_address:
                return JsonResponse({'error': 'Email address not found'}, status=404)
            
            if email_address.verified:
                return JsonResponse({'message': 'Email already verified'})
            
            # Get the most recent unsent confirmation or create one
            confirmation = EmailConfirmation.objects.filter(
                email_address=email_address,
                sent__isnull=True
            ).first()
            
            if not confirmation:
                # Create a new confirmation
                confirmation = EmailConfirmation.create(email_address)
                confirmation.sent = timezone.now()
                confirmation.save()
            
            # Manually send the confirmation email
            adapter = get_adapter()
            adapter.send_confirmation_mail(request, confirmation, signup=True)
            
            # Mark as sent
            confirmation.sent = timezone.now()
            confirmation.save()
            
            return JsonResponse({
                'message': 'Verification email sent manually',
                'confirmation_id': confirmation.id,
                'key': confirmation.key
            })
            
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    