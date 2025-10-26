# court_management/models.py

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.contrib.auth.models import User
from django.urls import reverse

class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile', null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    membership_date = models.DateField(auto_now_add=True)
    active = models.BooleanField(default=True)
    
    class Meta:
        permissions = [
            ("view_all_customers", "Can view all customers"),
            ("manage_customer_accounts", "Can manage customer accounts"),
        ]
    
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return reverse('customer-detail', args=[self.id])

class Court(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True)
    
    class Meta:
        permissions = [
            ("view_all_courts", "Can view all courts"),
            ("manage_court_info", "Can manage court information"),
            ("manage_court_schedules", "Can manage court schedules"),
        ]
    
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return reverse('court-detail', args=[self.id])

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('refunded', 'Refunded'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    court = models.ForeignKey(Court, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    fee = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        permissions = [
            ("view_all_bookings", "Can view all bookings"),
            ("manage_any_booking", "Can manage any booking"),
            ("cancel_any_booking", "Can cancel any booking"),
            ("process_any_payment", "Can process any payment"),
        ]
    
    def __str__(self):
        return f"{self.customer.name} - {self.court.name} ({self.start_time})"
    
    def get_absolute_url(self):
        return reverse('booking-detail', args=[self.id])
    
    def duration_hours(self):
        return (self.end_time - self.start_time).total_seconds() / 3600
    
    def delete(self, *args, **kwargs):
        # Prevent deletion of paid bookings at model level
        if self.payment_status == 'paid':
            raise ValueError("Cannot delete a paid booking")
        
        # Prevent deletion of past bookings
        if self.start_time < timezone.now():
            raise ValueError("Cannot delete past bookings")
        
        super().delete(*args, **kwargs)

class Employee(models.Model):
    POSITION_CHOICES = [
        ('manager', 'Manager'),
        ('attendant', 'Attendant'),
        ('cleaner', 'Cleaner'),
        ('maintenance', 'Maintenance'),
    ]
    
    name = models.CharField(max_length=100)
    position = models.CharField(max_length=20, choices=POSITION_CHOICES)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    hire_date = models.DateField()
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True)
    
    class Meta:
        permissions = [
            ("view_all_employees", "Can view all employees"),
            ("manage_employee_info", "Can manage employee information"),
            ("manage_employee_schedules", "Can manage employee schedules"),
            ("view_payroll_info", "Can view payroll information"),
            ("process_payroll", "Can process payroll"),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.position})"
    
    def get_absolute_url(self):
        return reverse('employee-detail', args=[self.id])

class WorkSchedule(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    notes = models.TextField(blank=True)
    
    class Meta:
        permissions = [
            ("view_all_schedules", "Can view all work schedules"),
            ("manage_any_schedule", "Can manage any work schedule"),
        ]
    
    def __str__(self):
        return f"{self.employee.name} - {self.date}"

class TimeEntry(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    clock_in = models.DateTimeField()
    clock_out = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        permissions = [
            ("view_all_time_entries", "Can view all time entries"),
            ("manage_any_time_entry", "Can manage any time entry"),
            ("use_time_clock", "Can use time clock system"),
        ]
    
    def __str__(self):
        return f"{self.employee.name} - {self.clock_in}"
    
    def duration_hours(self):
        if self.clock_out:
            return (self.clock_out - self.clock_in).total_seconds() / 3600
        return 0
    
    def calculate_pay(self):
        return self.duration_hours() * self.employee.hourly_rate

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('online', 'Online'),
        ('other', 'Other'),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    transaction_id = models.CharField(max_length=100, blank=True)
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        permissions = [
            ("view_all_payments", "Can view all payments"),
            ("manage_any_payment", "Can manage any payment"),
            ("process_refunds", "Can process refunds"),
        ]
    
    def __str__(self):
        return f"{self.booking} - {self.amount}"