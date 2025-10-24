from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site

class Command(BaseCommand):
    help = 'Set the Site domain for django-allauth emails'

    def handle(self, *args, **options):
        site, created = Site.objects.get_or_create(
            id=1,
            defaults={
                'domain': 'aeropace.com',
                'name': 'Aeropace Badminton Court'
            }
        )
        if not created:
            site.domain = 'aeropace.com'
            site.name = 'Aeropace Badminton Court'
            site.save()
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Site domain set to: aeropace.com')
        )