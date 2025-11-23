# court_management/components/forms/bookingForm.py

from django import forms
from ..models import (
    Booking, Customer, Court, TimeEntry
)

class BookingForm(forms.ModelForm):
    class Meta:
        model = Booking
        fields = ['customer', 'court', 'start_time', 'end_time', 'fee', 'status', 'payment_status', 'notes']
        widgets = {
            'start_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'end_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'notes': forms.Textarea(attrs={'rows': 3}),
        }
    
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        # If user is a customer, hide or disable the customer field
        if user and user.groups.filter(name='Customers').exists():
            try:
                customer = Customer.objects.get(user=user)
                self.fields['customer'].queryset = Customer.objects.filter(id=customer.id)
                self.fields['customer'].initial = customer
                self.fields['customer'].widget = forms.HiddenInput()
            except Customer.DoesNotExist:
                pass
        
        # Filter courts to only show active ones
        self.fields['court'].queryset = Court.objects.filter(active=True)
    
    def clean(self):
        cleaned_data = super().clean()
        start_time = cleaned_data.get('start_time')
        end_time = cleaned_data.get('end_time')
        court = cleaned_data.get('court')
        
        if start_time and end_time and court:
            if start_time >= end_time:
                raise forms.ValidationError("End time must be after start time.")
            
            # Check for overlapping bookings
            overlapping_bookings = Booking.objects.filter(
                court=court,
                start_time__lt=end_time,
                end_time__gt=start_time,
                status__in=['confirmed', 'in_progress']
            )
            
            if self.instance:
                overlapping_bookings = overlapping_bookings.exclude(pk=self.instance.pk)
            
            if overlapping_bookings.exists():
                raise forms.ValidationError("This court is already booked for the selected time period.")
        
        return cleaned_data

# Separate TimeEntry form
class TimeEntryForm(forms.ModelForm):
    class Meta:
        model = TimeEntry
        fields = ['employee', 'clock_in', 'clock_out', 'notes']
        widgets = {
            'clock_in': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'clock_out': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'notes': forms.Textarea(attrs={'rows': 3}),
        }
    
    def clean(self):
        cleaned_data = super().clean()
        clock_in = cleaned_data.get('clock_in')
        clock_out = cleaned_data.get('clock_out')
        
        if clock_in and clock_out:
            if clock_in >= clock_out:
                raise forms.ValidationError("Clock out time must be after clock in time.")
        
        return cleaned_data