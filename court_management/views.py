# court_management/views.py

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.template.loader import get_template
from django.contrib.auth import get_user_model

# Import models from the models package
from .components.models import Customer, Court, Booking, Employee

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
    test_setup_admin, get_verification_token, test_cleanup_user,
    debug_confirmation_status, debug_check_confirmation, update_site_domain,
    update_all_site_domains, check_pending_emails, send_pending_emails, 
    debug_site_config, debug_email_content, test_create_admin_group,
    test_delete_admin_group, test_create_regular_users_group, test_delete_regular_users_group,
    debug_check_user, test_set_user_staff, debug_social_providers, clear_cache_view
    )

# ============================================================================
# IMPORT ALL VIEWS FROM COMPONENT FILES (FOR BACKWARD COMPATIBILITY)
# ============================================================================

# Import views from separate view files to make them available at app level
from .components.views.bookings import *
from .components.views.courts import *
from .components.views.customers import *
from .components.views.employees import *
from .components.views.reports import *