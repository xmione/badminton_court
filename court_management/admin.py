# court_management/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib import messages
from django.utils.html import format_html
from django.urls import reverse
from django.http import HttpResponseRedirect
from .components.models import Customer, Court, Booking, Employee, WorkSchedule, TimeEntry, Payment

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'membership_date', 'active')
    list_filter = ('active', 'membership_date')
    search_fields = ('name', 'phone', 'email')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # If user is customer, only show their own profile
        if request.user.groups.filter(name='Customers').exists():
            try:
                customer = Customer.objects.get(user=request.user)
                return qs.filter(id=customer.id)
            except Customer.DoesNotExist:
                return qs.none()
        return qs
    
    def has_view_permission(self, request, obj=None):
        # Check if user has view permission
        if not super().has_view_permission(request, obj):
            return False
        
        # If user is customer, they can only view their own profile
        if request.user.groups.filter(name='Customers').exists():
            if obj and hasattr(obj, 'user') and obj.user != request.user:
                return False
        
        return True
    
    def has_change_permission(self, request, obj=None):
        # Check if user has change permission
        if not super().has_change_permission(request, obj):
            return False
        
        # If user is customer, they can only change their own profile
        if request.user.groups.filter(name='Customers').exists():
            if obj and hasattr(obj, 'user') and obj.user != request.user:
                return False
        
        return True
    
    def has_delete_permission(self, request, obj=None):
        # Customers cannot delete their profile
        if request.user.groups.filter(name='Customers').exists():
            return False
        
        return super().has_delete_permission(request, obj)

@admin.register(Court)
class CourtAdmin(admin.ModelAdmin):
    list_display = ('name', 'hourly_rate', 'active')
    list_filter = ('active',)
    search_fields = ('name',)
    
    def has_view_permission(self, request, obj=None):
        # Only staff and admin can view courts
        if request.user.groups.filter(name='Customers').exists():
            return False
        return super().has_view_permission(request, obj)
    
    def has_change_permission(self, request, obj=None):
        # Only staff and admin can change courts
        if request.user.groups.filter(name='Customers').exists():
            return False
        return super().has_change_permission(request, obj)
    
    def has_delete_permission(self, request, obj=None):
        # Only admin can delete courts
        if not request.user.is_superuser:
            return False
        return super().has_delete_permission(request, obj)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('customer', 'court', 'start_time', 'end_time', 'status', 'payment_status', 'fee')
    list_filter = ('status', 'payment_status', 'court', 'start_time')
    search_fields = ('customer__name', 'court__name', 'notes')
    date_hierarchy = 'start_time'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # If user is customer, only show their bookings
        if request.user.groups.filter(name='Customers').exists():
            try:
                customer = Customer.objects.get(user=request.user)
                return qs.filter(customer=customer)
            except Customer.DoesNotExist:
                return qs.none()
        return qs
    
    def has_view_permission(self, request, obj=None):
        # Check if user has view permission
        if not super().has_view_permission(request, obj):
            return False
        
        # If user is customer, they can only view their own bookings
        if request.user.groups.filter(name='Customers').exists():
            if obj and hasattr(obj, 'customer') and hasattr(obj.customer, 'user') and obj.customer.user != request.user:
                return False
        
        return True
    
    def has_change_permission(self, request, obj=None):
        # Check if user has change permission
        if not super().has_change_permission(request, obj):
            return False
        
        # If user is customer, they can only change their own bookings
        if request.user.groups.filter(name='Customers').exists():
            if obj and hasattr(obj, 'customer') and hasattr(obj.customer, 'user') and obj.customer.user != request.user:
                return False
        
        return True
    
    def has_delete_permission(self, request, obj=None):
        # Check if user has delete permission
        if not super().has_delete_permission(request, obj):
            return False
        
        # If user is customer, they cannot delete bookings
        if request.user.groups.filter(name='Customers').exists():
            return False
        
        # If booking is paid, only admin can delete it
        if obj and obj.payment_status == 'paid' and not request.user.is_superuser:
            return False
        
        return super().has_delete_permission(request, obj)
    
    def response_change(self, request, obj):
        # Add custom action buttons
        if "_process_payment" in request.POST:
            return HttpResponseRedirect(reverse('admin:process-payment', args=[obj.id]))
        return super().response_change(request, obj)

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'position', 'hourly_rate', 'hire_date', 'active')
    list_filter = ('position', 'active', 'hire_date')
    search_fields = ('name', 'phone', 'email')
    
    def has_view_permission(self, request, obj=None):
        # Only staff and admin can view employees
        if request.user.groups.filter(name='Customers').exists():
            return False
        return super().has_view_permission(request, obj)
    
    def has_change_permission(self, request, obj=None):
        # Only staff and admin can change employees
        if request.user.groups.filter(name='Customers').exists():
            return False
        return super().has_change_permission(request, obj)
    
    def has_delete_permission(self, request, obj=None):
        # Only admin can delete employees
        if not request.user.is_superuser:
            return False
        return super().has_delete_permission(request, obj)

@admin.register(WorkSchedule)
class WorkScheduleAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'start_time', 'end_time')
    list_filter = ('employee__position', 'date')
    search_fields = ('employee__name', 'notes')
    date_hierarchy = 'date'
    
    def has_view_permission(self, request, obj=None):
        # Only staff and admin can view work schedules
        if request.user.groups.filter(name='Customers').exists():
            return False
        return super().has_view_permission(request, obj)
    
    def has_change_permission(self, request, obj=None):
        # Only staff and admin can change work schedules
        if request.user.groups.filter(name='Customers').exists():
            return False
        return super().has_change_permission(request, obj)
    
    def has_delete_permission(self, request, obj=None):
        # Only admin can delete work schedules
        if not request.user.is_superuser:
            return False
        return super().has_delete_permission(request, obj)

@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin):
    list_display = ('employee', 'clock_in', 'clock_out', 'duration_hours', 'calculate_pay')
    list_filter = ('employee__position', 'clock_in')
    search_fields = ('employee__name', 'notes')
    date_hierarchy = 'clock_in'
    
    def has_view_permission(self, request, obj=None):
        # Only staff and admin can view time entries
        if request.user.groups.filter(name='Customers').exists():
            return False
        return super().has_view_permission(request, obj)
    
    def has_change_permission(self, request, obj=None):
        # Only staff and admin can change time entries
        if request.user.groups.filter(name='Customers').exists():
            return False
        return super().has_change_permission(request, obj)
    
    def has_delete_permission(self, request, obj=None):
        # Only admin can delete time entries
        if not request.user.is_superuser:
            return False
        return super().has_delete_permission(request, obj)

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('booking', 'amount', 'payment_method', 'payment_date')
    list_filter = ('payment_method', 'payment_date')
    search_fields = ('booking__customer__name', 'transaction_id', 'notes')
    date_hierarchy = 'payment_date'
    
    def has_view_permission(self, request, obj=None):
        # Only staff and admin can view payments
        if request.user.groups.filter(name='Customers').exists():
            return False
        return super().has_view_permission(request, obj)
    
    def has_change_permission(self, request, obj=None):
        # Only staff and admin can change payments
        if request.user.groups.filter(name='Customers').exists():
            return False
        return super().has_change_permission(request, obj)
    
    def has_delete_permission(self, request, obj=None):
        # Only admin can delete payments
        if not request.user.is_superuser:
            return False
        return super().has_delete_permission(request, obj)
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating a new payment
            obj.processed_by = request.user
        super().save_model(request, obj, form, change)