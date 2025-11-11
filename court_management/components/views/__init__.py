# court_management/components/views/__init__.py
from .bookings import BookingCreateView, BookingDeleteView, BookingDetailView, BookingListView, BookingUpdateView
from .courts import CourtCreateView, CourtDeleteView, CourtDetailView, CourtListView, CourtUpdateView
from .customers import CustomerCreateView, CustomerDeleteView, CustomerDetailView, CustomerListView, CustomerUpdateView
from .employees import EmployeeCreateView, EmployeeDeleteView, EmployeeDetailView, EmployeeListView, EmployeeUpdateView
from .test_reset_database import test_reset_database