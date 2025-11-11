# court_management/components/models/Payment.py

from django.db import models
from django.contrib.auth.models import User
from . import Booking

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