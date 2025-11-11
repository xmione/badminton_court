# court_management/components/models/Employee.py

from django.db import models
from django.urls import reverse

class Employee(models.Model):
    POSITION_CHOICES = [
        ('manager', 'Manager'),
        ('attendant', 'Attendant'),
        ('cleaner', 'Cleaner'),
        ('maintenance', 'Maintenance'),
    ]
    
    name = models.CharField(max_length=100)
    position = models.CharField(max_length=20, choices=POSITION_CHOICES)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    hire_date = models.DateField()
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True)
    
    class Meta:
        permissions = [
            ("view_all_employees", "Can view all employees"),
            ("manage_employee_info", "Can manage employee information"),
            ("manage_employee_schedules", "Can manage employee schedules"),
            ("view_payroll_info", "Can view payroll information"),
            ("process_payroll", "Can process payroll"),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.position})"
    
    def get_absolute_url(self):
        return reverse('employee-detail', args=[self.id])
 