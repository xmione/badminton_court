# court_management/management/commands/setup_permissions.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from court_management.components.models import Customer, Court, Booking, Employee, Payment

class Command(BaseCommand):
    help = 'Set up user groups and permissions'

    def handle(self, *args, **options):
        # Create groups
        admin_group, _ = Group.objects.get_or_create(name='Administrators')
        staff_group, _ = Group.objects.get_or_create(name='Staff')
        customer_group, _ = Group.objects.get_or_create(name='Customers')

        # Get permissions
        customer_ct = ContentType.objects.get_for_model(Customer)
        court_ct = ContentType.objects.get_for_model(Court)
        booking_ct = ContentType.objects.get_for_model(Booking)
        employee_ct = ContentType.objects.get_for_model(Employee)
        payment_ct = ContentType.objects.get_for_model(Payment)

        # Clear existing permissions
        admin_group.permissions.clear()
        staff_group.permissions.clear()
        customer_group.permissions.clear()

        # Assign permissions to Administrators (all permissions)
        all_permissions = Permission.objects.filter(
            content_type__in=[customer_ct, court_ct, booking_ct, employee_ct, payment_ct]
        )
        admin_group.permissions.set(all_permissions)

        # Assign permissions to Staff
        staff_permissions = [
            # Customer permissions
            *Permission.objects.filter(content_type=customer_ct, codename__in=['view_customer', 'add_customer', 'change_customer']),
            # Court permissions
            *Permission.objects.filter(content_type=court_ct),
            # Booking permissions
            *Permission.objects.filter(content_type=booking_ct),
            # Employee permissions
            *Permission.objects.filter(content_type=employee_ct),
            # Payment permissions
            *Permission.objects.filter(content_type=payment_ct),
        ]
        staff_group.permissions.set(staff_permissions)

        # Assign permissions to Customers (view and create bookings only)
        customer_permissions = [
            # View own customer profile
            *Permission.objects.filter(content_type=customer_ct, codename__in=['view_customer']),
            # View courts
            *Permission.objects.filter(content_type=court_ct, codename__in=['view_court']),
            # Create and view own bookings
            *Permission.objects.filter(content_type=booking_ct, codename__in=['add_booking', 'view_booking', 'change_booking']),
        ]
        customer_group.permissions.set(customer_permissions)

        self.stdout.write(self.style.SUCCESS('Permissions set up successfully'))