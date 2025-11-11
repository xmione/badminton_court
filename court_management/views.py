# court_management/views.py

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.template.loader import get_template
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods
from django.contrib.sites.models import Site

# Import models from the models package
from .models import Customer, Court, Booking, Employee

User = get_user_model()

# ============================================================================
# MAIN APPLICATION VIEWS
# ============================================================================

@login_required
def index(request):
    # Get today's bookings
    today = timezone.now().date()
    
    # Check if user is a customer
    is_customer = request.user.groups.filter(name='Customers').exists()
    
    # Filter bookings based on user role
    if is_customer:
        try:
            customer = Customer.objects.get(user=request.user)
            today_bookings = Booking.objects.filter(
                start_time__date=today, 
                customer=customer
            ).order_by('start_time')
        except Customer.DoesNotExist:
            today_bookings = Booking.objects.none()
    else:
        today_bookings = Booking.objects.filter(start_time__date=today).order_by('start_time')
    
    # Get active courts
    active_courts = Court.objects.filter(active=True).count()
    
    # Get total customers
    if request.user.has_perm('court_management.view_all_customers'):
        total_customers = Customer.objects.filter(active=True).count()
    else:
        total_customers = 0
    
    # Get active employees
    if request.user.has_perm('court_management.view_all_employees'):
        active_employees = Employee.objects.filter(active=True).count()
    else:
        active_employees = 0
    
    # Get recent activities (last 5 bookings)
    if request.user.has_perm('court_management.view_all_bookings'):
        recent_bookings = Booking.objects.order_by('-created_at')[:5]
    else:
        recent_bookings = Booking.objects.none()
    
    # Format recent activities for display
    recent_activities = []
    for booking in recent_bookings:
        activity = {
            'title': f"New booking by {booking.customer.name}",
            'description': f"Court {booking.court.name} at {booking.start_time.strftime('%Y-%m-%d %H:%M')}",
            'timestamp': booking.created_at
        }
        recent_activities.append(activity)
    
    context = {
        'today_bookings': today_bookings,
        'active_courts': active_courts,
        'total_customers': total_customers,
        'active_employees': active_employees,
        'recent_activities': recent_activities,
        'can_add_booking': request.user.has_perm('court_management.add_booking'),
        'is_customer': is_customer,
    }
    
    return render(request, 'court_management/index.html', context)

@login_required
def profile(request):
    return render(request, 'court_management/profile.html')

# ============================================================================
# DEBUG AND TESTING VIEWS
# ============================================================================

# Test template view for debugging
def test_template(request):
    try:
        template = get_template('account/login.html')
        return HttpResponse(f"Template found: {template.origin}")
    except Exception as e:
        return HttpResponse(f"Template not found: {str(e)}")

# Debug view for permissions
@login_required
def debug_permissions(request):
    """Debug view to check user permissions"""
    user = request.user
    groups = user.groups.all()
    
    # Get all permissions for this user
    user_permissions = user.get_all_permissions()
    
    # Check specific permissions
    can_add_booking = user.has_perm('court_management.add_booking')
    can_view_booking = user.has_perm('court_management.view_booking')
    can_view_court = user.has_perm('court_management.view_court')
    
    context = {
        'user': user,
        'groups': groups,
        'user_permissions': user_permissions,
        'can_add_booking': can_add_booking,
        'can_view_booking': can_view_booking,
        'can_view_court': can_view_court,
    }
    
    return render(request, 'court_management/debug_permissions.html', context)

# ============================================================================
# TEST API ENDPOINTS FOR CYPRESS TESTING
# ============================================================================
 
from .components.views import (
    test_reset_database, test_create_user, test_verify_user,
    test_setup_admin )


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
    
@csrf_exempt
@require_http_methods(["POST"])
def update_site_domain(request):
    """
    API endpoint to update the Site domain and name.
    This is used by Cypress tests to ensure the correct domain is set.
    """
    try:
        data = json.loads(request.body)
        domain = data.get('domain')
        name = data.get('name')
        
        if not domain or not name:
            return JsonResponse({
                'error': 'Both domain and name are required'
            }, status=400)
        
        # Get or create the site with the configured SITE_ID
        site, created = Site.objects.get_or_create(
            id=settings.SITE_ID,
            defaults={
                'domain': domain,
                'name': name
            }
        )
        
        # Update if it already existed
        if not created:
            site.domain = domain
            site.name = name
            site.save()
        
        action = 'created' if created else 'updated'
        
        return JsonResponse({
            'message': f'Site successfully {action}',
            'site_id': site.id,
            'domain': site.domain,
            'name': site.name
        }, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)
    
@csrf_exempt
@require_http_methods(["POST"])
def update_all_site_domains(request):
    """
    Update ALL Site objects in the database to ensure django-allauth uses the correct domain.
    """
    try:
        data = json.loads(request.body)
        domain = data.get('domain')
        name = data.get('name')
        
        if not domain or not name:
            return JsonResponse({
                'error': 'Both domain and name are required'
            }, status=400)
        
        # Update ALL Site objects, not just the one with SITE_ID
        from django.contrib.sites.models import Site
        sites = Site.objects.all()
        updated_count = 0
        
        for site in sites:
            site.domain = domain
            site.name = name
            site.save()
            updated_count += 1
        
        # Also update the default site if no sites exist
        if updated_count == 0:
            Site.objects.create(domain=domain, name=name)
            updated_count = 1
        
        return JsonResponse({
            'message': f'All {updated_count} site domain(s) updated successfully',
            'updated_count': updated_count,
            'domain': domain,
            'name': name
        }, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)
    
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
    
@csrf_exempt
@require_http_methods(["POST"])
def debug_site_config(request):
    """Debug endpoint to check site configuration"""
    from django.contrib.sites.models import Site
    from django.conf import settings
    
    site = Site.objects.get_current()
    
    return JsonResponse({
        'site_id': settings.SITE_ID,
        'site_domain': site.domain,
        'site_name': site.name,
        'default_from_email': settings.DEFAULT_FROM_EMAIL,
        'account_email_subject_prefix': getattr(settings, 'ACCOUNT_EMAIL_SUBJECT_PREFIX', 'Not set'),
    })

@csrf_exempt
@require_http_methods(["POST"])
def debug_email_content(request):
    """Debug endpoint to see what email content would be generated"""
    from allauth.account.adapter import get_adapter
    from django.contrib.sites.models import Site
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    site = Site.objects.get_current()
    adapter = get_adapter()
    
    data = json.loads(request.body)
    email = data.get('email')
    
    # Create a mock context similar to what allauth uses
    context = {
        'user': User(email=email, username=email),
        'current_site': site,
        'activate_url': f"http://{site.domain}/accounts/confirm-email/test-key/",
        'key': 'test-key',
    }
    
    # Try to render the email templates
    try:
        subject = "Test Subject"
        message = "Test Message"
        
        # This is how allauth renders emails internally
        from django.template.loader import render_to_string
        
        subject_template = 'account/email/email_confirmation_subject'
        message_template = 'account/email/email_confirmation_message'
        
        subject = render_to_string(subject_template, context).strip()
        message = render_to_string(message_template, context)
        
    except Exception as e:
        subject = f"Error: {str(e)}"
        message = f"Error: {str(e)}"
    
    return JsonResponse({
        'generated_subject': subject,
        'generated_message': message,
        'context_used': {
            'site_domain': site.domain,
            'site_name': site.name,
            'user_email': email,
        }
    })

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

@csrf_exempt
@require_http_methods(["POST"])
def test_delete_admin_group(request):
    """
    Delete an Administrators group for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        from django.contrib.auth.models import Group
        
        # Try to get the Administrators group
        try:
            group = Group.objects.get(name='Administrators')
            group.delete()
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group deleted successfully'
            })
        except Group.DoesNotExist:
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group does not exist'
            })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)
    """
    Delete an Administrators group for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        from django.contrib.auth.models import Group
        
        # Try to get the Administrators group
        try:
            group = Group.objects.get(name='Administrators')
            group.delete()
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group deleted successfully'
            })
        except Group.DoesNotExist:
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group does not exist'
            })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)
    
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
        from court_management.models import (
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

@csrf_exempt
@require_http_methods(["POST"])
def test_delete_regular_users_group(request):
    """
    Delete a Regular Users group for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        from django.contrib.auth.models import Group
        
        # Try to get the Regular Users group
        try:
            group = Group.objects.get(name='Regular Users')
            group.delete()
            return JsonResponse({
                'status': 'success', 
                'message': 'Regular Users group deleted successfully'
            })
        except Group.DoesNotExist:
            return JsonResponse({
                'status': 'success', 
                'message': 'Regular Users group does not exist'
            })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def debug_check_user(request):
    """
    Debug endpoint to check if a user exists and their details.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(email=email)
            return JsonResponse({
                'status': 'success',
                'user_exists': True,
                'user_id': user.id,
                'username': user.username,
                'is_active': user.is_active,
                'is_staff': user.is_staff,  # This is the key flag
                'groups': [group.name for group in user.groups.all()]
            })
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'success',
                'user_exists': False
            })
            
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def test_set_user_staff(request):
    """
    Set the is_staff flag for a user for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        is_staff = data.get('is_staff', True)
        
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(email=email)
            user.is_staff = is_staff
            user.save()
            
            return JsonResponse({
                'status': 'success',
                'message': f'User {email} is_staff flag set to {is_staff}'
            })
        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'User not found'}, status=404)
            
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

# ============================================================================
# IMPORT ALL VIEWS FROM COMPONENT FILES (FOR BACKWARD COMPATIBILITY)
# ============================================================================

# Import views from separate view files to make them available at app level
from .components.views.bookings import *
from .components.views.courts import *
from .components.views.customers import *
from .components.views.employees import *
from .components.views.reports import *