# court_management/management/commands/update_social_media_accounts.py
from django.core.management.base import BaseCommand
from allauth.socialaccount.models import SocialApp
from django.conf import settings 
from django.contrib.sites.models import Site

class Command(BaseCommand):
    help = 'Update social media account credentials from environment variables'

    def handle(self, *args, **options):
        current_site = Site.objects.get_current()
        
        providers = {
            'google': {
                'client_id': settings.GOOGLE_CLIENT_ID,
                'secret': settings.GOOGLE_CLIENT_SECRET,
            },
            'facebook': {
                'client_id': settings.FACEBOOK_CLIENT_ID,
                'secret': settings.FACEBOOK_CLIENT_SECRET,
            },
            'twitter': {
                'client_id': settings.TWITTER_CLIENT_ID,
                'secret': settings.TWITTER_CLIENT_SECRET,
            }
        }
        
        for provider_name, credentials in providers.items():
            if not credentials['client_id'] or not credentials['secret']:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping {provider_name}: credentials not found in environment"
                    )
                )
                continue
                
            try:
                app = SocialApp.objects.get(provider=provider_name)
                app.client_id = credentials['client_id']
                app.secret = credentials['secret']
                app.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Updated {provider_name.title()} OAuth credentials"
                    )
                )
            except SocialApp.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ {provider_name.title()} SocialApp not found in database"
                    )
                )