# court_management/components/models/WorkSchedule.py

from django.db import models
from employee import Employee

class WorkSchedule(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    notes = models.TextField(blank=True)
    
    class Meta:
        permissions = [
            ("view_all_schedules", "Can view all work schedules"),
            ("manage_any_schedule", "Can manage any work schedule"),
        ]
    
    def __str__(self):
        return f"{self.employee.name} - {self.date}"
