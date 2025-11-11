from django.core.management.base import BaseCommand
from allauth.socialaccount.models import SocialApp

class Command(BaseCommand):
    help = 'Fix provider_id fields for social apps'

    def handle(self, *args, **options):
        updated = 0
        for app in SocialApp.objects.all():
            if not app.provider_id:
                app.provider_id = app.provider
                app.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Updated {app.name}: provider_id = {app.provider}')
                )
                updated += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated} social app(s)')
        )