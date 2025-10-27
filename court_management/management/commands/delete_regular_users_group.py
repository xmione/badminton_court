# court_management/management/commands/delete_regular_users_group.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group


class Command(BaseCommand):
    help = 'Delete the Regular Users group'

    def handle(self, *args, **options):
        try:
            # Try to get the Regular Users group
            try:
                group = Group.objects.get(name='Regular Users')
                group.delete()
                self.stdout.write(self.style.SUCCESS(
                    'Regular Users group deleted successfully'
                ))
            except Group.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    'Regular Users group does not exist'
                ))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))