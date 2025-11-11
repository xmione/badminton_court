# court_management/components/forms/customers.py

from django import forms
from ..models import (Customer)

class CustomerForm(forms.ModelForm):
    class Meta:
        model = Customer
        fields = ['name', 'email', 'phone', 'address', 'active']
        widgets = {
            'address': forms.Textarea(attrs={'rows': 3}),
        }
 