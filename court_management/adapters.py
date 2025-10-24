from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings
from django.contrib.sites.models import Site

class CustomEmailAdapter(DefaultAccountAdapter):
    def format_email_subject(self, subject):
        # Replace any instance of example.com with our domain
        subject = subject.replace('example.com', 'aeropace.com')
        subject = subject.replace('Example.com', 'Aeropace Badminton Court')
        return super().format_email_subject(subject)
    
    def render_mail(self, template_prefix, email, context, headers=None):
        # Completely override the email rendering
        subject = "[Aeropace Badminton Court] Please Confirm Your Email Address"
        message = f"""Hello from Aeropace Badminton Court!

You're receiving this email because user {context.get('user', '')} has given your email address to register an account on aeropace.com.

To confirm this is correct, go to {context.get('activate_url', '')}

Thank you for using Aeropace Badminton Court!
aeropace.com"""
        
        return self._render_mail(subject, message, email, headers)
    
    def _render_mail(self, subject, message, email, headers):
        from django.core.mail import EmailMessage
        return EmailMessage(subject, message, settings.DEFAULT_FROM_EMAIL, [email], headers=headers)