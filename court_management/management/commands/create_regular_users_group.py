# court_management/management/commands/create_regular_users_group.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission, User
from django.contrib.contenttypes.models import ContentType
from court_management.models import (
    Customer, Court, Booking, Payment, 
    Employee, WorkSchedule, TimeEntry
)
from django.conf import settings


class Command(BaseCommand):
    help = 'Create or update the Regular Users group with appropriate permissions'

    def handle(self, *args, **options):
        try:
            # Get or create the Regular Users group
            group, created = Group.objects.get_or_create(name='Regular Users')
            
            # Get all content types for our models
            content_types = ContentType.objects.get_for_models(
                Customer, Court, Booking, Payment, 
                Employee, WorkSchedule, TimeEntry
            ).values()
            
            # Define the permissions that regular users should have
            # They can manage their own bookings and view courts
            permission_codenames = [
                # Booking permissions (for their own bookings)
                'view_booking',
                'add_booking',
                'change_booking',
                'delete_booking',
                # Court permissions (view only)
                'view_court',
                # Customer permissions (view their own profile)
                'view_customer',
                'change_customer',
            ]
            
            # Get the specific permissions
            permissions = Permission.objects.filter(
                content_type__in=content_types,
                codename__in=permission_codenames
            )
            
            # Add these permissions to the group
            group.permissions.set(permissions)
            
            self.stdout.write(self.style.SUCCESS(
                f'Regular Users group {"created" if created else "updated"} successfully with {permissions.count()} permissions'
            ))
            
            # List the permissions added
            for perm in permissions:
                self.stdout.write(f'  - {perm.content_type.model}: {perm.name}')
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))