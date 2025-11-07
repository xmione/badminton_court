# court_management/management/commands/create_test_customer.py
# To create a new test customer:
# python manage.py create_test_customer --email customer@aeropace.com --password StrongPassword123! --name "Test Customer"
# ========================================================================================================================

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.contrib.auth.models import Group, Permission
from court_management.models import Customer

class Command(BaseCommand):
    help = 'Create a test customer user'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Email for the test user')
        parser.add_argument('--password', type=str, help='Password for the test user')
        parser.add_argument('--name', type=str, help='Name for the test user')

    def handle(self, *args, **options):
        email = options.get('email', 'customer@test.com')
        password = options.get('password', 'testpass123')
        name = options.get('name', 'Test Customer')
        
        # First, ensure the Customers group exists
        customer_group, created = Group.objects.get_or_create(name='Customers')
        if created:
            self.stdout.write(self.style.SUCCESS('Created Customers group'))
        
        # Create or get the user
        user, created = User.objects.get_or_create(
            username=email,
            defaults={
                'email': email,
                'first_name': name.split(' ')[0],
                'last_name': ' '.join(name.split(' ')[1:]) if ' ' in name else '',
                'is_active': True,
            }
        )
        
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created user: {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'User already exists: {email}'))
        
        # Add user to Customers group
        user.groups.add(customer_group)
        self.stdout.write(self.style.SUCCESS(f'Added {email} to Customers group'))
        
        # Create customer profile
        customer, created = Customer.objects.get_or_create(
            user=user,
            defaults={
                'name': name,
                'email': user.email,
                'phone': '123-456-7890',
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created customer profile for {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Customer profile already exists for {email}'))
        
        # Check permissions
        can_add_booking = user.has_perm('court_management.add_booking')
        can_view_booking = user.has_perm('court_management.view_booking')
        
        self.stdout.write(self.style.SUCCESS(f'Can add booking: {can_add_booking}'))
        self.stdout.write(self.style.SUCCESS(f'Can view booking: {can_view_booking}'))
        
        # List all user's permissions
        all_perms = user.get_all_permissions()
        self.stdout.write(self.style.SUCCESS('All permissions:'))
        for perm in all_perms:
            self.stdout.write(f'  - {perm}')