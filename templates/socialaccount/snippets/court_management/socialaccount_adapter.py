from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialApp

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_app(self, request, provider, client_id=None):
        """
        Override the buggy get_app method with a working implementation.
        """
        from django.contrib.sites.models import Site
        
        # Get the current site
        site = Site.objects.get_current(request)
        
        # Get the app by provider and site
        app = SocialApp.objects.filter(
            provider=provider,
            sites__id=site.id
        ).first()
        
        if not app:
            from allauth.socialaccount.exceptions import SocialAppConfigured
            raise SocialAppConfigured(f"No {provider} app configured for site {site.id}")
            
        return app