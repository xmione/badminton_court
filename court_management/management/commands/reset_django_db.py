# court_management/management/commands/reset_django_db.py

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Reset the Django database for testing purposes'

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError('This command can only be used in DEBUG mode')

        self.stdout.write('Resetting Django database...')

        # 1. Ensure all tables exist (in case of migration drift or missing tables)
        self.stdout.write('Running migrate to sync schema...')
        call_command('migrate', verbosity=0, interactive=False)

        # 2. Now flush – all tables are guaranteed to exist
        try:
            call_command('flush', verbosity=0, interactive=False)
            self.stdout.write(self.style.SUCCESS('Django database flushed successfully'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error flushing database: {str(e)}'))
            raise CommandError(f'Error flushing database: {str(e)}')