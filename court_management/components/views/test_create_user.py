# court_management/components/views/test_create_user.py

import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.conf import settings

@csrf_exempt
@require_POST
def test_create_user(request):
    """
    Create a verified user for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({'status': 'error', 'message': 'Email and password are required'}, status=400)
        
        # Check if user already exists first
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(username=email)
            # User exists, just update password and ensure active
            user.set_password(password)
            user.is_active = True
            user.save()
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create_user(username=email, email=email, password=password)
        
        # Handle EmailAddress for django-allauth
        try:
            from allauth.account.models import EmailAddress
            email_address, created = EmailAddress.objects.get_or_create(
                user=user,
                email=email,
                defaults={'primary': True, 'verified': True}
            )
            if not created:
                email_address.verified = True
                email_address.primary = True
                email_address.save()
        except Exception as e:
            # Log the error but don't fail the whole request
            print(f"Error creating EmailAddress: {str(e)}")
        
        return JsonResponse({'status': 'success', 'message': 'User created successfully'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    