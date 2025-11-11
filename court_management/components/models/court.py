# court_management/components/models/Court.py

from django.db import models
from django.urls import reverse

class Court(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True)
    
    class Meta:
        permissions = [
            ("view_all_courts", "Can view all courts"),
            ("manage_court_info", "Can manage court information"),
            ("manage_court_schedules", "Can manage court schedules"),
        ]
    
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return reverse('court-detail', args=[self.id])
