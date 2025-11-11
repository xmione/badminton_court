# court_management/components/models/customer.py

from django.db import models
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
