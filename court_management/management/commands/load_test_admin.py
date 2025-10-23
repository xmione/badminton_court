# court_management/management/commands/load_test_admin.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.conf import settings  # Import settings to access environment variables

class Command(BaseCommand):
    help = 'Load test admin users for Cypress admin login tests'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Remove all existing test admin users before creating new ones',
        )
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Username for the admin user (default: admin)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='password',
            help='Password for the admin user (default: password)',
        )
        parser.add_argument(
            '--email',
            type=str,
            default=None,  # We'll set this dynamically
            help='Email for the admin user (will use domain from settings)',
        )
    
    def handle(self, *args, **options):
        reset = options['reset']
        username = options['username']
        password = options['password']
        
        # Get domain from settings or use default
        domain = getattr(settings, 'DOMAIN_NAME')
        
        # Set email based on provided email or construct from username and domain
        if options['email']:
            email = options['email']
        else:
            email = f"{username}@{domain}"
        
        # If reset flag is provided, remove all test admin users
        if reset:
            # Remove admin users that match our test pattern
            test_admins = User.objects.filter(
                is_superuser=True,
                is_staff=True,
                username__in=['admin', 'test_admin', 'superuser']
            )
            count = test_admins.count()
            test_admins.delete()
            self.stdout.write(
                self.style.SUCCESS(f'Removed {count} existing test admin users')
            )
        
        # Create admin user if it doesn't exist
        admin_user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_superuser': True,
                'is_staff': True,
                'is_active': True,
            }
        )
        
        # Always update the password to ensure it's consistent
        admin_user.password = make_password(password)
        admin_user.email = email
        admin_user.is_superuser = True
        admin_user.is_staff = True
        admin_user.is_active = True
        admin_user.save()
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Admin user "{username}" created successfully with email "{email}"'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'Admin user "{username}" already exists, password and settings updated'
                )
            )
        
        # Create additional test admin users for different scenarios
        self._create_test_admin_users(domain)
        
        self.stdout.write(
            self.style.SUCCESS(f'Admin test data loaded successfully with domain: {domain}')
        )
    
    def _create_test_admin_users(self, domain):
        """Create additional test admin users for different testing scenarios"""
        
        # Create a superadmin with different credentials
        superadmin, created = User.objects.get_or_create(
            username='superadmin',
            defaults={
                'email': f'superadmin@{domain}',
                'is_superuser': True,
                'is_staff': True,
                'is_active': True,
            }
        )
        superadmin.password = make_password('superpassword')
        superadmin.save()
        
        if created:
            self.stdout.write(
                self.style.SUCCESS('Superadmin user "superadmin" created')
            )
        
        # Create a staff user (admin but not superuser)
        staff_user, created = User.objects.get_or_create(
            username='staff_admin',
            defaults={
                'email': f'staff@{domain}',
                'is_superuser': False,
                'is_staff': True,
                'is_active': True,
            }
        )
        staff_user.password = make_password('staffpassword')
        staff_user.save()
        
        if created:
            self.stdout.write(
                self.style.SUCCESS('Staff admin user "staff_admin" created')
            )
        
        # Create an inactive admin for testing inactive scenarios
        inactive_admin, created = User.objects.get_or_create(
            username='inactive_admin',
            defaults={
                'email': f'inactive@{domain}',
                'is_superuser': True,
                'is_staff': True,
                'is_active': False,
            }
        )
        inactive_admin.password = make_password('inactivepassword')
        inactive_admin.save()
        
        if created:
            self.stdout.write(
                self.style.SUCCESS('Inactive admin user "inactive_admin" created')
            )