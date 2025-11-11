# court_management/components/views/__init__.py
from .bookings import BookingCreateView, BookingDeleteView, BookingDetailView, BookingListView, BookingUpdateView
from .courts import CourtCreateView, CourtDeleteView, CourtDetailView, CourtListView, CourtUpdateView
from .customers import CustomerCreateView, CustomerDeleteView, CustomerDetailView, CustomerListView, CustomerUpdateView
from .employees import EmployeeCreateView, EmployeeDeleteView, EmployeeDetailView, EmployeeListView, EmployeeUpdateView
from .test_reset_database import test_reset_database
from .test_create_user import test_create_user
from .test_verify_user import test_verify_user
from .test_setup_admin import test_setup_admin

# Explicitly define what gets imported with `from . import *`
__all__ = [
    'BookingCreateView', 'BookingDeleteView', 'BookingDetailView', 'BookingListView', 'BookingUpdateView',
    'CourtCreateView', 'CourtDeleteView', 'CourtDetailView', 'CourtListView', 'CourtUpdateView',
    'CustomerCreateView', 'CustomerDeleteView', 'CustomerDetailView', 'CustomerListView', 'CustomerUpdateView',
    'EmployeeCreateView', 'EmployeeDeleteView', 'EmployeeDetailView', 'EmployeeListView', 'EmployeeUpdateView',
    'test_reset_database', 'test_create_user', 'test_verify_user', 'test_setup_admin'
]