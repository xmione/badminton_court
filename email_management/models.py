from django.db import models


class Organization(models.Model):
    name = models.CharField(max_length=100)
    email_domain = models.CharField(max_length=100, help_text="Email domain for this organization (e.g., company.com)")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']