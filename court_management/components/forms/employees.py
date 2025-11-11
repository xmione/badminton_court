# court_management/forms.py

from django import forms
from ..models import ( Employee )

class EmployeeForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = ['name', 'position', 'email', 'phone', 'address', 'hire_date', 'hourly_rate', 'active']
        widgets = {
            'hire_date': forms.DateInput(attrs={'type': 'date'}),
            'address': forms.Textarea(attrs={'rows': 3}),
        }
 