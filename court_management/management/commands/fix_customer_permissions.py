# court_management/management/commands/fix_customer_permissions.py
# To fix the existing regularuser:
# python manage.py fix_customer_permissions regularuser
# ================================================================

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.contrib.auth.models import Group
from court_management.models import Customer

class Command(BaseCommand):
    help = 'Fix permissions for an existing user by adding them to Customers group'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to fix')

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(username=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {email} does not exist'))
            return
        
        # Get or create Customers group
        customer_group, created = Group.objects.get_or_create(name='Customers')
        if created:
            self.stdout.write(self.style.SUCCESS('Created Customers group'))
        
        # Add user to Customers group
        user.groups.add(customer_group)
        self.stdout.write(self.style.SUCCESS(f'Added {email} to Customers group'))
        
        # Create customer profile if it doesn't exist
        customer, created = Customer.objects.get_or_create(
            user=user,
            defaults={
                'name': f'{user.first_name} {user.last_name}'.strip() or user.username,
                'email': user.email,
                'phone': '123-456-7890',
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created customer profile for {email}'))
        
        # Check permissions
        can_add_booking = user.has_perm('court_management.add_booking')
        can_view_booking = user.has_perm('court_management.view_booking')
        
        self.stdout.write(self.style.SUCCESS(f'Can add booking: {can_add_booking}'))
        self.stdout.write(self.style.SUCCESS(f'Can view booking: {can_view_booking}'))