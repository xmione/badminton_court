from django.contrib import admin
from .models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'email_domain', 'created_at']
    search_fields = ['name', 'email_domain']
    list_filter = ['created_at']