# court_management/management/commands/create_delete_booking_data.py
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.db import connection
from datetime import timedelta
from court_management.components.models import Customer, Court, Booking

class Command(BaseCommand):
    help = 'Create test data for bookings (customers, courts, and bookings)'

    def handle(self, *args, **options):
        try:
            # Ensure we're using the correct database connection
            db_settings = settings.DATABASES['default']
            self.stdout.write(f"Using database: {db_settings['NAME']} on {db_settings['HOST']}:{db_settings['PORT']}")
            
            with transaction.atomic():
                # Delete existing test data to ensure clean state
                Customer.objects.filter(name__in=["John Doe", "Jane Smith"]).delete()
                Court.objects.filter(name__in=["Court 1", "Court 2"]).delete()
                Booking.objects.filter(customer__name__in=["John Doe", "Jane Smith"]).delete()
                
                # Get domain from settings 
                domain = getattr(settings, 'POSTE_DOMAIN', 'aeropace.com')
                
                # Create test customers
                john_doe = Customer.objects.create(
                    name="John Doe",
                    phone="1234567890",
                    email=f"john@{domain}",
                    active=True
                )
                
                jane_smith = Customer.objects.create(
                    name="Jane Smith",
                    phone="9876543210",
                    email=f"jane@{domain}",
                    active=True
                )
                
                # Create test courts
                court_1 = Court.objects.create(
                    name="Court 1",
                    hourly_rate=20.00,
                    description="Main court",
                    active=True
                )
                
                court_2 = Court.objects.create(
                    name="Court 2",
                    hourly_rate=25.00,
                    description="Premium court",
                    active=True
                )
                
                # Create a test booking for John Doe with timezone-aware datetimes
                tomorrow = timezone.now() + timedelta(days=1)
                tomorrow = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
                end_time = tomorrow.replace(hour=11, minute=0)
                
                Booking.objects.create(
                    customer=jane_smith,
                    court=court_1,
                    start_time=tomorrow,
                    end_time=end_time,
                    fee=20.00
                )
                
                self.stdout.write(self.style.SUCCESS(f'Successfully created test booking data with domain: {domain}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating test data: {str(e)}'))
            raise