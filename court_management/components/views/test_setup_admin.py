# court_management/components/views/test_setup_admin.py

import json
import logging
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()

@csrf_exempt
@require_POST
def test_setup_admin(request):
    """
    Setup test admin users for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        # Parse request body for options
        data = json.loads(request.body) if request.body else {}
        
        # Get parameters from request or environment variables (no fallbacks)
        username = data.get('username', getattr(settings, 'ADMIN_EMAIL', None))
        password = data.get('password', getattr(settings, 'ADMIN_PASSWORD', None))
        email = data.get('email', getattr(settings, 'ADMIN_EMAIL', None))
        reset = data.get('reset', True)
        
        # Debug logging
        logger = logging.getLogger(__name__)
        logger.info(f"test_setup_admin called with username: {username}, email: {email}, reset: {reset}")
        
        # Verify environment variables are set
        if not username:
            logger.error("ADMIN_EMAIL environment variable is not set")
            return JsonResponse({'status': 'error', 'message': 'ADMIN_EMAIL environment variable is not set'}, status=400)
        if not password:
            logger.error("ADMIN_PASSWORD environment variable is not set")
            return JsonResponse({'status': 'error', 'message': 'ADMIN_PASSWORD environment variable is not set'}, status=400)
        if not email:
            logger.error("ADMIN_EMAIL environment variable is not set")
            return JsonResponse({'status': 'error', 'message': 'ADMIN_EMAIL environment variable is not set'}, status=400)
        
        # Reset existing admin if requested
        if reset:
            User.objects.filter(username__in=['admin', 'superadmin', 'staff_admin', 'inactive_admin']).delete()
        
        # Create the main admin user
        admin_user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_superuser': True,
                'is_staff': True,
                'is_active': True,
            }
        )
        
        # Always set the password to ensure it's correct
        admin_user.set_password(password)
        admin_user.save()
        
        # CRITICAL: Handle EmailAddress for django-allauth
        try:
            from allauth.account.models import EmailAddress
            email_address, created = EmailAddress.objects.get_or_create(
                user=admin_user,
                email=email,
                defaults={'primary': True, 'verified': True}  # Ensure it's verified
            )
            if not created:
                email_address.verified = True
                email_address.primary = True
                email_address.save()
        except Exception as e:
            # Log the error but don't fail the whole request
            print(f"Error creating EmailAddress: {str(e)}")
        
        # Create additional test admin users if not already present
        if not User.objects.filter(username='superadmin').exists():
            superadmin = User.objects.create_user(
                username='superadmin',
                email=getattr(settings, 'SUPERADMIN_EMAIL'),
                password=getattr(settings, 'SUPERADMIN_PASSWORD')
            )
            superadmin.is_superuser = True
            superadmin.is_staff = True
            superadmin.save()
        
        if not User.objects.filter(username='staff_admin').exists():
            staff_admin = User.objects.create_user(
                username='staff_admin',
                email=getattr(settings, 'STAFF_ADMIN_EMAIL'),
                password=getattr(settings, 'STAFF_ADMIN_PASSWORD')
            )
            staff_admin.is_superuser = False
            staff_admin.is_staff = True
            staff_admin.save()
        
        if not User.objects.filter(username='inactive_admin').exists():
            inactive_admin = User.objects.create_user(
                username='inactive_admin',
                email=getattr(settings, 'INACTIVE_ADMIN_EMAIL'),
                password=getattr(settings, 'INACTIVE_ADMIN_PASSWORD')
            )
            inactive_admin.is_superuser = True
            inactive_admin.is_staff = True
            inactive_admin.is_active = False
            inactive_admin.save()
        
        if created:
            message = f"Admin user '{username}' created successfully"
            logger.info(message)
        else:
            message = f"Admin user '{username}' updated successfully"
            logger.info(message)
            
        return JsonResponse({'status': 'success', 'message': message})
    except Exception as e:
        logger.error(f"Error in test_setup_admin: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    