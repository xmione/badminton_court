# court_management/management/commands/setup_permissions.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from court_management.models import Customer, Court, Booking, Employee, WorkSchedule, TimeEntry, Payment

class Command(BaseCommand):
    help = 'Sets up user groups and permissions for the court management system'

    def handle(self, *args, **options):
        # Create groups
        admin_group, created = Group.objects.get_or_create(name='Administrators')
        self.stdout.write(self.style.SUCCESS(f'Administrators group: {"created" if created else "already exists"}'))
        
        staff_group, created = Group.objects.get_or_create(name='Staff')
        self.stdout.write(self.style.SUCCESS(f'Staff group: {"created" if created else "already exists"}'))
        
        reception_group, created = Group.objects.get_or_create(name='Reception')
        self.stdout.write(self.style.SUCCESS(f'Reception group: {"created" if created else "already exists"}'))
        
        customer_group, created = Group.objects.get_or_create(name='Customers')
        self.stdout.write(self.style.SUCCESS(f'Customers group: {"created" if created else "already exists"}'))

        # Get all content types
        customer_ct = ContentType.objects.get_for_model(Customer)
        court_ct = ContentType.objects.get_for_model(Court)
        booking_ct = ContentType.objects.get_for_model(Booking)
        employee_ct = ContentType.objects.get_for_model(Employee)
        work_schedule_ct = ContentType.objects.get_for_model(WorkSchedule)
        time_entry_ct = ContentType.objects.get_for_model(TimeEntry)
        payment_ct = ContentType.objects.get_for_model(Payment)

        # Get all permissions
        customer_permissions = Permission.objects.filter(content_type=customer_ct)
        court_permissions = Permission.objects.filter(content_type=court_ct)
        booking_permissions = Permission.objects.filter(content_type=booking_ct)
        employee_permissions = Permission.objects.filter(content_type=employee_ct)
        work_schedule_permissions = Permission.objects.filter(content_type=work_schedule_ct)
        time_entry_permissions = Permission.objects.filter(content_type=time_entry_ct)
        payment_permissions = Permission.objects.filter(content_type=payment_ct)

        # Clear existing permissions
        admin_group.permissions.clear()
        staff_group.permissions.clear()
        reception_group.permissions.clear()
        customer_group.permissions.clear()

        # Assign permissions to Administrators (all permissions)
        admin_group.permissions.set(
            list(customer_permissions) + 
            list(court_permissions) + 
            list(booking_permissions) + 
            list(employee_permissions) +
            list(work_schedule_permissions) +
            list(time_entry_permissions) +
            list(payment_permissions)
        )
        self.stdout.write(self.style.SUCCESS(f'Assigned {admin_group.permissions.count()} permissions to Administrators'))

        # Assign permissions to Staff
        staff_permissions = [
            # Customer permissions (except delete)
            *Permission.objects.filter(codename__in=['view_customer', 'add_customer', 'change_customer', 'view_all_customers', 'manage_customer_accounts']),
            # Court permissions (all)
            *list(court_permissions),
            # Booking permissions (all)
            *list(booking_permissions),
            # Employee permissions (except delete and payroll)
            *Permission.objects.filter(codename__in=['view_employee', 'add_employee', 'change_employee', 'view_all_employees', 'manage_employee_info', 'manage_employee_schedules']),
            # WorkSchedule permissions
            *list(work_schedule_permissions),
            # TimeEntry permissions
            *list(time_entry_permissions),
        ]
        staff_group.permissions.set(staff_permissions)
        self.stdout.write(self.style.SUCCESS(f'Assigned {len(staff_permissions)} permissions to Staff'))

        # Assign permissions to Reception
        reception_permissions = [
            # Customer permissions (view and add only)
            *Permission.objects.filter(codename__in=['view_customer', 'add_customer', 'view_all_customers']),
            # Court permissions (view only)
            *Permission.objects.filter(codename__in=['view_court', 'view_all_courts']),
            # Booking permissions (all except delete)
            *Permission.objects.filter(codename__in=['view_booking', 'add_booking', 'change_booking', 'view_all_bookings', 'manage_any_booking', 'cancel_any_booking', 'process_any_payment']),
            # Payment permissions
            *list(payment_permissions),
        ]
        reception_group.permissions.set(reception_permissions)
        self.stdout.write(self.style.SUCCESS(f'Assigned {len(reception_permissions)} permissions to Reception'))

        # Assign permissions to Customers - THIS IS THE KEY PART
        customer_permissions = [
            # Customer permissions (view own only)
            *Permission.objects.filter(codename__in=['view_customer']),
            # Court permissions (view only)
            *Permission.objects.filter(codename__in=['view_court', 'view_all_courts']),
            # Booking permissions - CRITICAL: Include add_booking!
            *Permission.objects.filter(codename__in=['view_booking', 'add_booking', 'change_booking'])
        ]
        customer_group.permissions.set(customer_permissions)
        self.stdout.write(self.style.SUCCESS(f'Assigned {len(customer_permissions)} permissions to Customers'))
        
        # List the specific permissions for Customers
        self.stdout.write(self.style.SUCCESS('Customers group permissions:'))
        for perm in customer_group.permissions.all():
            self.stdout.write(f'  - {perm.codename}')

        self.stdout.write(self.style.SUCCESS('Successfully set up user groups and permissions'))