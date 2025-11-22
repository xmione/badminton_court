# court_management/components/views/test_create_regular_users_group.py

import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()

@csrf_exempt
@require_http_methods(["POST"])
def test_create_regular_users_group(request):
    """
    Create or update a Regular Users group with appropriate permissions for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        from django.contrib.auth.models import Group, Permission
        from django.contrib.contenttypes.models import ContentType
        from court_management.components.models import (  # ✅ FIXED: Added .components
            Customer, Court, Booking, Payment, 
            Employee, WorkSchedule, TimeEntry
        )
        
        # Get or create the Regular Users group
        group, created = Group.objects.get_or_create(name='Regular Users')
        
        # Get all content types for our models
        content_types = ContentType.objects.get_for_models(
            Customer, Court, Booking, Payment, 
            Employee, WorkSchedule, TimeEntry
        ).values()
        
        # Define the permissions that regular users should have
        permission_codenames = [
            # Booking permissions (for their own bookings)
            'view_booking',
            'add_booking',
            'change_booking',
            'delete_booking',
            # Court permissions (view only)
            'view_court',
            # Customer permissions (view their own profile)
            'view_customer',
            'change_customer',
        ]
        
        # Get the specific permissions
        permissions = Permission.objects.filter(
            content_type__in=content_types,
            codename__in=permission_codenames
        )
        
        # Add these permissions to the group
        group.permissions.set(permissions)
        
        if created:
            return JsonResponse({
                'status': 'success', 
                'message': f'Regular Users group created successfully with {permissions.count()} permissions'
            })
        else:
            return JsonResponse({
                'status': 'success', 
                'message': f'Regular Users group updated successfully with {permissions.count()} permissions'
            })
            
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        
        return JsonResponse({
            'status': 'error', 
            'message': str(e),
            'traceback': error_details
        }, status=500)