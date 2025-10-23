# court_management/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

User = get_user_model()

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created:
        # Send welcome email
        subject = 'Welcome to Badminton Court Management System'
        
        # Simple text message instead of HTML template for now
        message = f"""
        Welcome to Badminton Court Management System
        
        Hello {instance.get_full_name() or instance.username},
        
        Thank you for registering with the Badminton Court Management System.
        
        Your account has been successfully created and you can now:
        - Book badminton courts
        - View your booking history
        - Manage your profile
        
        Please verify your email address by clicking on the link in the verification email we've sent you.
        
        If you have any questions or need assistance, please don't hesitate to contact our support team.
        
        Best regards,
        The Badminton Court Management Team
        """
        
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [instance.email]
        
        try:
            send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                fail_silently=False,
            )
            print(f"Welcome email sent to {instance.email}")
        except Exception as e:
            print(f"Failed to send welcome email: {e}")