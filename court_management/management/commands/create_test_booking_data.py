# court_management/management/commands/create_test_booking_data.py
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.conf import settings
import os
from datetime import timedelta
from court_management.components.models import Customer, Court, Booking

class Command(BaseCommand):
    help = 'Create test data for bookings (customers, courts, and bookings)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing test data before creating new data',
        )
    
    def handle(self, *args, **options):
        reset = options['reset']
        
        try:
            with transaction.atomic():
                # Define test data identifiers
                test_customer_names = ["John Doe", "Jane Smith"]
                test_court_names = ["Court 1", "Court 2"]
                
                # Delete existing test data if reset flag is provided
                if reset:
                    self.stdout.write('Deleting existing test booking data...')
                    # Delete bookings first to avoid foreign key constraint issues
                    Booking.objects.filter(customer__name__in=test_customer_names).delete()
                    Customer.objects.filter(name__in=test_customer_names).delete()
                    Court.objects.filter(name__in=test_court_names).delete()
                
                # Get domain from environment variable or settings
                domain = (
                    os.environ.get('POSTE_DOMAIN') or 
                    getattr(settings, 'POSTE_DOMAIN', None) or
                    'aeropace.com'  # Default fallback
                )
                
                # Create test customers
                john_doe, created = Customer.objects.get_or_create(
                    name="John Doe",
                    defaults={
                        'phone': "1234567890",
                        'email': f"john@{domain}",
                        'active': True
                    }
                )
                
                jane_smith, created = Customer.objects.get_or_create(
                    name="Jane Smith",
                    defaults={
                        'phone': "9876543210",
                        'email': f"jane@{domain}",
                        'active': True
                    }
                )
                
                # Create test courts
                court_1, created = Court.objects.get_or_create(
                    name="Court 1",
                    defaults={
                        'hourly_rate': 20.00,
                        'description': "Main court",
                        'active': True
                    }
                )
                
                court_2, created = Court.objects.get_or_create(
                    name="Court 2",
                    defaults={
                        'hourly_rate': 25.00,
                        'description': "Premium court",
                        'active': True
                    }
                )
                
                # Create a test booking for John Doe with timezone-aware datetimes
                tomorrow = timezone.now() + timedelta(days=1)
                tomorrow = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
                end_time = tomorrow.replace(hour=11, minute=0)
                
                booking, created = Booking.objects.get_or_create(
                    customer=john_doe,
                    court=court_1,
                    start_time=tomorrow,
                    defaults={
                        'end_time': end_time,
                        'fee': 20.00
                    }
                )
                
                self.stdout.write(self.style.SUCCESS(f'Successfully created test booking data with domain: {domain}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating test data: {str(e)}'))
            raise