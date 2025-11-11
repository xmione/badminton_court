# court_management/components/models/Booking.py

from django.db import models
from django.utils import timezone
from django.urls import reverse
from . import Customer, Court

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
 