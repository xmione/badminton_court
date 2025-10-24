# badminton_court/__init__.py
# Import Celery app to ensure it's imported when Django starts
from .celery import app as celery_app

__all__ = ('celery_app',)

# Patch django-allauth to force correct domain in emails
def patch_allauth_email_domain():
    """Force django-allauth to use our domain in emails"""
    from django.contrib.sites.models import Site
    from allauth.account.adapter import DefaultAccountAdapter
    
    original_render_mail = DefaultAccountAdapter.render_mail
    
    def patched_render_mail(self, template_prefix, email, context, headers=None):
        # Force our domain into the context before email rendering
        context['current_site'] = Site.objects.get_current()
        return original_render_mail(self, template_prefix, email, context, headers)
    
    DefaultAccountAdapter.render_mail = patched_render_mail

# Apply the patch when Django starts
try:
    patch_allauth_email_domain()
except Exception as e:
    print(f"Note: Could not patch django-allauth: {e}")