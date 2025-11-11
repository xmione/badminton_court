# court_management/components/views/test_cleanup_user.py

import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()

# for testing cleanup
@csrf_exempt
@require_POST
def test_cleanup_user(request):
    """
    Clean up a specific user and their email confirmations for testing.
    Only available in DEBUG mode.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
        
        # Import django-allauth models
        from allauth.account.models import EmailAddress, EmailConfirmation
        
        # Delete user and all related data
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
            
            # Delete email confirmations
            email_addresses = EmailAddress.objects.filter(user=user)
            for email_addr in email_addresses:
                EmailConfirmation.objects.filter(email_address=email_addr).delete()
            
            # Delete email addresses
            email_addresses.delete()
            
            # Delete user
            user.delete()
            
            return JsonResponse({'status': 'success', 'message': f'User {email} cleaned up successfully'})
        except User.DoesNotExist:
            return JsonResponse({'status': 'success', 'message': 'User not found (already clean)'})
            
    except Exception as e:
        import traceback
        print(f"Error in test_cleanup_user: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
