# court_management/components/forms/mixins.py

from django import forms
from ..models import ( WorkSchedule, TimeEntry )

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
    