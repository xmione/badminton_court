# court_management/components/views/__init__.py
from .bookings import BookingCreateView, BookingDeleteView, BookingDetailView, BookingListView, BookingUpdateView
from .courts import CourtCreateView, CourtDeleteView, CourtDetailView, CourtListView, CourtUpdateView
from .customers import CustomerCreateView, CustomerDeleteView, CustomerDetailView, CustomerListView, CustomerUpdateView
from .employees import EmployeeCreateView, EmployeeDeleteView, EmployeeDetailView, EmployeeListView, EmployeeUpdateView
from .test_reset_database import test_reset_database
from .test_create_user import test_create_user
from .test_verify_user import test_verify_user
from .test_setup_admin import test_setup_admin
from .get_verification_token import get_verification_token
from .test_cleanup_user import test_cleanup_user
from .debug_confirmation_status import debug_confirmation_status
from .debug_check_confirmation import debug_check_confirmation
from .update_site_domain import update_site_domain
from .update_all_site_domains import update_all_site_domains
from .check_pending_emails import check_pending_emails
from .send_pending_emails import send_pending_emails
from .debug_site_config import debug_site_config
from .debug_email_content import debug_email_content
from .test_create_admin_group import test_create_admin_group
from .test_delete_admin_group import test_delete_admin_group
from .test_create_regular_users_group import test_create_regular_users_group
from .test_delete_regular_users_group import test_delete_regular_users_group
from .debug_check_user import debug_check_user
from .test_set_user_staff import test_set_user_staff
from .debug_social_providers import debug_social_providers
from .clear_cache import clear_cache_view
from .test_database import reset_django_database, reset_posteio_database, reset_all_databases
from .test_user_count import test_user_count

# Explicitly define what gets imported with `from . import *`
__all__ = [
    'BookingCreateView', 'BookingDeleteView', 'BookingDetailView', 'BookingListView', 'BookingUpdateView',
    'CourtCreateView', 'CourtDeleteView', 'CourtDetailView', 'CourtListView', 'CourtUpdateView',
    'CustomerCreateView', 'CustomerDeleteView', 'CustomerDetailView', 'CustomerListView', 'CustomerUpdateView',
    'EmployeeCreateView', 'EmployeeDeleteView', 'EmployeeDetailView', 'EmployeeListView', 'EmployeeUpdateView',
    'test_reset_database', 'test_create_user', 'test_verify_user', 'test_setup_admin', 'get_verification_token',
    'test_cleanup_user', 'debug_confirmation_status', 'debug_check_confirmation', 'update_site_domain',
    'update_all_site_domains', 'check_pending_emails', 'send_pending_emails', 'debug_site_config',
    'debug_email_content', 'test_create_admin_group', 'test_delete_admin_group', 'test_create_regular_users_group',
    'test_delete_regular_users_group', 'debug_check_user', 'test_set_user_staff', 'debug_social_providers',
    'clear_cache_view', 'reset_django_database', 'reset_posteio_database', 'reset_all_databases', 'test_user_count'

]