from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from .models import Booking
import logging

logger = logging.getLogger(__name__)

@shared_task
def check_booking_end_times():
    """
    Check for bookings that are ending soon and send notifications
    """
    now = timezone.now()
    threshold = now + timezone.timedelta(minutes=15)  # 15 minutes before end
    
    upcoming_end_bookings = Booking.objects.filter(
        end_time__lte=threshold,
        end_time__gt=now,
        status='in_progress',
        notified=False
    )
    
    for booking in upcoming_end_bookings:
        try:
            # Send email notification if customer has email
            if booking.customer.email:
                send_mail(
                    'Your booking time is ending soon',
                    f'Dear {booking.customer.name},\n\nYour booking at {booking.court.name} will end in 15 minutes at {booking.end_time.strftime("%Y-%m-%d %H:%M")}.\n\nPlease finish your game on time.\n\nThank you,\nBadminton Court Management',
                    settings.DEFAULT_FROM_EMAIL,
                    [booking.customer.email],
                    fail_silently=False,
                )
            
            # Mark booking as notified
            booking.notified = True
            booking.save()
            
            logger.info(f"Sent notification for booking {booking.id}")
        except Exception as e:
            logger.error(f"Error sending notification for booking {booking.id}: {str(e)}")
    
    return f"Processed {upcoming_end_bookings.count()} bookings"

@shared_task
def update_booking_status():
    """
    Update booking status based on current time
    """
    now = timezone.now()
    
    # Update bookings to 'in_progress' if start time has passed
    Booking.objects.filter(
        start_time__lte=now,
        end_time__gt=now,
        status='confirmed'
    ).update(status='in_progress')
    
    # Update bookings to 'completed' if end time has passed
    Booking.objects.filter(
        end_time__lte=now,
        status='in_progress'
    ).update(status='completed')
    
    return "Booking statuses updated"

@shared_task
def send_daily_report():
    """
    Send daily report to manager
    """
    today = timezone.now().date()
    tomorrow = today + timezone.timedelta(days=1)
    
    # Get today's bookings
    bookings = Booking.objects.filter(
        start_time__date=today
    )
    
    # Calculate statistics
    total_bookings = bookings.count()
    completed_bookings = bookings.filter(status='completed').count()
    total_revenue = bookings.aggregate(total=Sum('fee'))['total'] or 0
    
    # Get tomorrow's bookings
    tomorrow_bookings = Booking.objects.filter(
        start_time__date=tomorrow
    ).count()
    
    # Create report content
    report_content = f"""
    Daily Report - {today.strftime('%Y-%m-%d')}
    
    Today's Bookings: {total_bookings}
    Completed Bookings: {completed_bookings}
    Total Revenue: ${total_revenue}
    
    Tomorrow's Bookings: {tomorrow_bookings}
    """
    
    # Get manager email
    managers = Employee.objects.filter(position='manager', active=True)
    
    for manager in managers:
        if manager.email:
            try:
                send_mail(
                    f'Daily Report - {today.strftime("%Y-%m-%d")}',
                    report_content,
                    settings.DEFAULT_FROM_EMAIL,
                    [manager.email],
                    fail_silently=False,
                )
                logger.info(f"Sent daily report to {manager.name}")
            except Exception as e:
                logger.error(f"Error sending daily report to {manager.name}: {str(e)}")
    
    return "Daily report sent"