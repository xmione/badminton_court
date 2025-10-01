# court_management/admin.py

from django.contrib import admin
from .models import Customer, Court, Booking, Employee, WorkSchedule, TimeEntry, Payment

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'membership_date', 'active')
    list_filter = ('active', 'membership_date')
    search_fields = ('name', 'phone', 'email')

@admin.register(Court)
class CourtAdmin(admin.ModelAdmin):
    list_display = ('name', 'hourly_rate', 'active')
    list_filter = ('active',)
    search_fields = ('name',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('customer', 'court', 'start_time', 'end_time', 'status', 'payment_status', 'fee')
    list_filter = ('status', 'payment_status', 'court', 'start_time')
    search_fields = ('customer__name', 'court__name', 'notes')
    date_hierarchy = 'start_time'

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'position', 'hourly_rate', 'hire_date', 'active')
    list_filter = ('position', 'active', 'hire_date')
    search_fields = ('name', 'phone', 'email')

@admin.register(WorkSchedule)
class WorkScheduleAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'start_time', 'end_time')
    list_filter = ('employee__position', 'date')
    search_fields = ('employee__name', 'notes')
    date_hierarchy = 'date'

@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin):
    list_display = ('employee', 'clock_in', 'clock_out', 'duration_hours', 'calculate_pay')
    list_filter = ('employee__position', 'clock_in')
    search_fields = ('employee__name', 'notes')
    date_hierarchy = 'clock_in'

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('booking', 'amount', 'payment_method', 'payment_date')
    list_filter = ('payment_method', 'payment_date')
    search_fields = ('booking__customer__name', 'transaction_id', 'notes')
    date_hierarchy = 'payment_date'