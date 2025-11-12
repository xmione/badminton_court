# court_management/management/commands/reset_django_db.py

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.apps import apps
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Reset the Django database for testing purposes'

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError('This command can only be used in DEBUG mode')
        
        self.stdout.write('Resetting Django database...')
        
        # Get all models
        all_models = apps.get_models()
        
        # Sort models by name to ensure consistent deletion order
        sorted_models = sorted(all_models, key=lambda model: model._meta.label)
        
        # Delete all instances of each model
        for model in sorted_models:
            try:
                count = model.objects.count()
                model.objects.all().delete()
                self.stdout.write(f'  Deleted {count} {model._meta.model_name} objects')
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  Error deleting {model._meta.label}: {str(e)}'))
        
        # Reset migration history
        call_command('migrate', fake=True, verbosity=0)
        
        self.stdout.write(self.style.SUCCESS('Django database reset successfully'))