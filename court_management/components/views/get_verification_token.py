# court_management/components/views/test_verification_token.py

import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()

@csrf_exempt
@require_POST
def get_verification_token(request):
    """
    Get or create a verification token for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
        
        # Get the user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'User not found'}, status=404)
        
        # Import django-allauth models and utilities
        from allauth.account.models import EmailAddress, EmailConfirmation
        from django.utils import timezone
        
        # Get or create the email address
        email_address, created = EmailAddress.objects.get_or_create(
            user=user,
            email=email,
            defaults={'primary': True, 'verified': False}
        )
        
        # If already verified, return success
        if email_address.verified:
            return JsonResponse({
                'status': 'success',
                'token': 'already_verified',
                'message': 'Email already verified',
                'verified': True
            })
        
        # CRITICAL: Delete ALL existing confirmations for this email
        # Old confirmations can interfere with new ones
        deleted_count = EmailConfirmation.objects.filter(email_address=email_address).delete()[0]
        if deleted_count > 0:
            print(f"Deleted {deleted_count} old confirmation(s) for {email}")
        
        # Create a NEW confirmation record
        confirmation = EmailConfirmation.create(email_address)
        
        # IMPORTANT: Set sent timestamp BEFORE saving
        # This is required for the confirmation to be valid
        confirmation.sent = timezone.now()
        confirmation.save()
        
        # Verify the confirmation was created properly
        if not confirmation.key:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to generate confirmation key'
            }, status=500)
        
        # Double-check it's in the database
        try:
            EmailConfirmation.objects.get(key=confirmation.key)
        except EmailConfirmation.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Confirmation was not saved to database'
            }, status=500)
        
        return JsonResponse({
            'status': 'success',
            'token': confirmation.key,
            'verified': False,
            'email': email,
            'created_at': confirmation.created.isoformat(),
            'sent_at': confirmation.sent.isoformat() if confirmation.sent else None,
            'user_id': user.id
        })
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_verification_token: {str(e)}")
        print(error_trace)
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'trace': error_trace if settings.DEBUG else None
        }, status=500)
