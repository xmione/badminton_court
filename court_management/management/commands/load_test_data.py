# court_management/management/commands/load_test_data.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.conf import settings  # Import settings to access environment variables
from court_management.models import Customer, Court, Employee

class Command(BaseCommand):
    help = 'Load test data for Cypress tests'
    
    def handle(self, *args, **options):
        # Get domain from settings or use default
        domain = getattr(settings, 'DOMAIN_NAME')
        
        # Create admin user if it doesn't exist
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': f'admin@{domain}',
                'is_superuser': True,
                'is_staff': True
            }
        )
        
        if created:
            admin_user.set_password('password')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Admin user created'))
        else:
            # Update password if user already exists
            admin_user.set_password('password')
            admin_user.save()
            self.stdout.write(self.style.WARNING('Admin user already exists, password updated'))
        
        # Clear existing test data (except admin user)
        Customer.objects.all().delete()
        Court.objects.all().delete()
        Employee.objects.all().delete()
        
        # Create test customers
        Customer.objects.create(name="John Doe", phone="1234567890", email=f"john@{domain}")
        Customer.objects.create(name="Jane Smith", phone="9876543210", email=f"jane@{domain}")
        
        # Create test courts
        Court.objects.create(name="Court 1", hourly_rate=20.00, description="Main court")
        Court.objects.create(name="Court 2", hourly_rate=25.00, description="Premium court")
        
        # Create test employees
        Employee.objects.create(
            name="Manager User", 
            position="manager", 
            phone="5551234567", 
            hourly_rate=30.00,
            hire_date="2023-01-01"
        )
        
        self.stdout.write(self.style.SUCCESS(f'Test data loaded successfully with domain: {domain}'))