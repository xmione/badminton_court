# court_management/components/forms/courtForm.py

from django import forms
from ..models import ( Court )

class CourtForm(forms.ModelForm):
    class Meta:
        model = Court
        fields = ['name', 'description', 'hourly_rate', 'active']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }
