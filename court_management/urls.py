# court_management/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Home/Dashboard
    path('', views.index, name='index'),
    
    # Authentication URLs
    # path('signup/', views.SignUpView.as_view(), name='signup'),
    path('profile/', views.profile, name='profile'),
    
    # Booking URLs
    path('bookings/', views.BookingListView.as_view(), name='booking-list'),
    path('bookings/<int:pk>/', views.BookingDetailView.as_view(), name='booking-detail'),
    path('bookings/create/', views.BookingCreateView.as_view(), name='booking-create'),
    path('bookings/<int:pk>/update/', views.BookingUpdateView.as_view(), name='booking-update'),
    path('bookings/<int:pk>/delete/', views.BookingDeleteView.as_view(), name='booking-delete'),
    path('bookings/<int:pk>/payment/', views.make_payment, name='make-payment'),
    path('bookings/<int:pk>/cancel/', views.cancel_booking, name='booking-cancel'),
    
    # Customer URLs
    path('customers/', views.CustomerListView.as_view(), name='customer-list'),
    path('customers/<int:pk>/', views.CustomerDetailView.as_view(), name='customer-detail'),
    path('customers/create/', views.CustomerCreateView.as_view(), name='customer-create'),
    path('customers/<int:pk>/update/', views.CustomerUpdateView.as_view(), name='customer-update'),
    path('customers/<int:pk>/delete/', views.CustomerDeleteView.as_view(), name='customer-delete'),
    path('customers/<int:pk>/history/', views.customer_booking_history, name='customer-booking-history'),
    
    # Court URLs
    path('courts/', views.CourtListView.as_view(), name='court-list'),
    path('courts/<int:pk>/', views.CourtDetailView.as_view(), name='court-detail'),
    path('courts/create/', views.CourtCreateView.as_view(), name='court-create'),
    path('courts/<int:pk>/update/', views.CourtUpdateView.as_view(), name='court-update'),
    path('courts/<int:pk>/delete/', views.CourtDeleteView.as_view(), name='court-delete'),
    
    # Employee URLs
    path('employees/', views.EmployeeListView.as_view(), name='employee-list'),
    path('employees/<int:pk>/', views.EmployeeDetailView.as_view(), name='employee-detail'),
    path('employees/create/', views.EmployeeCreateView.as_view(), name='employee-create'),
    path('employees/<int:pk>/update/', views.EmployeeUpdateView.as_view(), name='employee-update'),
    path('employees/<int:pk>/delete/', views.EmployeeDeleteView.as_view(), name='employee-delete'),
    path('employees/<int:pk>/schedule/', views.employee_schedule, name='employee-schedule'),
    path('employees/<int:pk>/schedule/<int:year>/<int:month>/', views.employee_schedule, name='employee-schedule-month'),
    path('employees/<int:pk>/clock-in/', views.clock_in, name='employee-clock-in'),
    path('employees/<int:pk>/clock-out/', views.clock_out, name='employee-clock-out'),
    
    # Report URLs
    path('reports/sales/', views.sales_report, name='sales-report'),
    path('reports/sales/export/', views.export_sales_report_csv, name='export-sales-report'),
    path('reports/payroll/', views.payroll_report, name='payroll-report'),
    path('reports/payroll/<int:year>/<int:month>/', views.payroll_report, name='payroll-report-month'),
    
    # Test Template
    path('test-template/', views.test_template, name='test-template'),

    path('api/get-verification-token/', views.get_verification_token, name='get-verification-token'),

    # Test API endpoints (only available in DEBUG mode)
    path('api/test-reset-database/', views.test_reset_database, name='test-reset-database'),
    path('api/test-create-user/', views.test_create_user, name='test-create-user'),
    path('api/test-verify-user/', views.test_verify_user, name='test-verify-user'),
    path('api/test-setup-admin/', views.test_setup_admin, name='test-setup-admin'),
    path('api/test-cleanup-user/', views.test_cleanup_user, name='test-cleanup-user'), 
    path('api/get-verification-token/', views.get_verification_token, name='get-verification-token'),
    path('api/debug-check-confirmation/', views.debug_check_confirmation, name='debug-check-confirmation'),
    path('api/debug-confirmation/<str:token>/', views.debug_confirmation_status, name='debug-confirmation-status'),
    path('api/update-site-domain/', views.update_site_domain, name='update_site_domain'),
    path('api/update-all-site-domains/', views.update_all_site_domains, name='update_all_site_domains'),
    path('api/check-pending-emails/', views.check_pending_emails, name='check_pending_emails'),
    path('api/send-pending-emails/', views.send_pending_emails, name='send_pending_emails'),
    path('api/debug-site-config/', views.debug_site_config, name='debug_site_config'),
    path('api/debug-email-content/', views.debug_email_content, name='debug_email_content'),
    path('debug-permissions/', views.debug_permissions, name='debug-permissions'),
    path('api/test-create-admin-group/', views.test_create_admin_group, name='test-create-admin-group'),
    path('api/test-delete-admin-group/', views.test_delete_admin_group, name='test-delete-admin-group'),
    path('api/test-create-regular-users-group/', views.test_create_regular_users_group, name='test-create-regular-users-group'),
    path('api/test-delete-regular-users-group/', views.test_delete_regular_users_group, name='test-delete-regular-users-group'),
    path('api/debug-check-user/', views.debug_check_user, name='debug-check-user'),
    path('api/test-set-user-staff/', views.test_set_user_staff, name='test-set-user-staff'),
    
]