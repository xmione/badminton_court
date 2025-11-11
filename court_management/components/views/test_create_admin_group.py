# court_management/components/views/test_create_admin_group.py

import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()


@csrf_exempt
@require_http_methods(["POST"])
def test_create_admin_group(request):
    """
    Create or update an Administrators group with all permissions for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        from django.contrib.auth.models import Group, Permission
        from django.contrib.contenttypes.models import ContentType
        from court_management.models import (
            Customer, Court, Booking, Payment, 
            Employee, WorkSchedule, TimeEntry
        )
        
        # Get or create the Administrators group
        group, created = Group.objects.get_or_create(name='Administrators')
        
        # Get all content types for our models
        content_types = ContentType.objects.get_for_models(
            Customer, Court, Booking, Payment, 
            Employee, WorkSchedule, TimeEntry
        ).values()
        
        # Get all permissions for these content types
        permissions = Permission.objects.filter(content_type__in=content_types)
        
        # Add all permissions to the group
        group.permissions.set(permissions)
        
        if created:
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group created successfully with all permissions'
            })
        else:
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group updated successfully with all permissions'
            })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)
