# court_management/signals.py

from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from allauth.account.signals import email_confirmed

User = get_user_model()

# Send welcome email ONLY after email is verified (not on signup)
@receiver(email_confirmed)
def send_welcome_email_after_confirmation(request, email_address, **kwargs):
    """Send welcome email after user confirms their email address"""
    user = email_address.user
    
    subject = 'Welcome to Badminton Court Management System'
    message = f"""
    Welcome to Badminton Court Management System
    
    Hello {user.username},
    
    Your email has been successfully verified!
    
    You can now:
    - Book badminton courts
    - View your booking history
    - Manage your profile
    
    Best regards,
    The Badminton Court Management Team
    """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        print(f"Welcome email sent to {user.email}")
    except Exception as e:
        print(f"Failed to send welcome email: {e}")