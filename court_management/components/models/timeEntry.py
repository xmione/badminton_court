# court_management/components/models/TimeEntry.py

from django.db import models
from employee import Employee

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
 