from django import forms
from .models import (
    Booking, Payment, Customer, Court, 
    Employee, WorkSchedule, TimeEntry
)

class BookingForm(forms.ModelForm):
    class Meta:
        model = Booking
        fields = ['customer', 'court', 'start_time', 'end_time', 'fee', 'status', 'payment_status', 'notes']
        widgets = {
            'start_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'end_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'notes': forms.Textarea(attrs={'rows': 4}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['customer'].queryset = Customer.objects.filter(active=True)
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

class PaymentForm(forms.ModelForm):
    class Meta:
        model = Payment
        fields = ['amount', 'payment_method', 'transaction_id', 'notes']
        widgets = {
            'notes': forms.Textarea(attrs={'rows': 3}),
        }

class CustomerForm(forms.ModelForm):
    class Meta:
        model = Customer
        fields = ['name', 'email', 'phone', 'address', 'active']
        widgets = {
            'address': forms.Textarea(attrs={'rows': 3}),
        }

class CourtForm(forms.ModelForm):
    class Meta:
        model = Court
        fields = ['name', 'description', 'hourly_rate', 'active']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }

class EmployeeForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = ['name', 'position', 'email', 'phone', 'address', 'hire_date', 'hourly_rate', 'active']
        widgets = {
            'hire_date': forms.DateInput(attrs={'type': 'date'}),
            'address': forms.Textarea(attrs={'rows': 3}),
        }

class WorkScheduleForm(forms.ModelForm):
    class Meta:
        model = WorkSchedule
        fields = ['employee', 'date', 'start_time', 'end_time', 'notes']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
            'start_time': forms.TimeInput(attrs={'type': 'time'}),
            'end_time': forms.TimeInput(attrs={'type': 'time'}),
            'notes': forms.Textarea(attrs={'rows': 3}),
        }
    
    def clean(self):
        cleaned_data = super().clean()
        start_time = cleaned_data.get('start_time')
        end_time = cleaned_data.get('end_time')
        
        if start_time and end_time:
            if start_time >= end_time:
                raise forms.ValidationError("End time must be after start time.")
        
        return cleaned_data

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