# court_management/components/views/reports.py

from django.shortcuts import render
from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate, TruncMonth
from django.http import HttpResponse
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend

import matplotlib.pyplot as plt
import io
import base64
import pandas as pd
import calendar
from datetime import datetime, timedelta

from ..models import ( Booking, Payment, Employee, TimeEntry )
 
from django.contrib.auth.decorators import login_required, permission_required

# Import Decimal for precise calculations
from decimal import Decimal

# Report Views
@login_required
@permission_required('court_management.view_booking', raise_exception=True)
def sales_report(request):
    # Get date range from request or use default (last 30 days)
    end_date = timezone.now().date()
    start_date = request.GET.get('start_date')
    
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    else:
        start_date = end_date - timedelta(days=30)
    
    # Get bookings within date range
    bookings = Booking.objects.filter(
        start_time__date__gte=start_date,
        start_time__date__lte=end_date
    )
    
    # Calculate total revenue
    total_revenue = bookings.aggregate(total=Sum('fee'))['total'] or Decimal('0.00')
    
    # Calculate daily revenue
    daily_revenue = bookings.annotate(
        date=TruncDate('start_time')
    ).values('date').annotate(
        revenue=Sum('fee'),
        bookings_count=Count('id')
    ).order_by('date')
    
    # Calculate total bookings count (sum of bookings_count from daily_revenue)
    total_bookings_count = sum(item['bookings_count'] for item in daily_revenue)

    # Calculate average revenue per booking
    avg_revenue_per_booking = Decimal('0.00')
    if total_bookings_count > 0:
        avg_revenue_per_booking = total_revenue / total_bookings_count
    
    # Calculate monthly revenue
    monthly_revenue = bookings.annotate(
        month=TruncMonth('start_time')
    ).values('month').annotate(
        revenue=Sum('fee'),
        bookings_count=Count('id')
    ).order_by('month')
    
    # Revenue by court
    court_revenue = bookings.values('court__name').annotate(
        revenue=Sum('fee'),
        bookings_count=Count('id')
    ).order_by('-revenue')
    
    # Revenue by payment method
    payment_method_revenue = Payment.objects.filter(
        booking__start_time__date__gte=start_date,
        booking__start_time__date__lte=end_date
    ).values('payment_method').annotate(
        revenue=Sum('amount'),
        payments_count=Count('id')
    ).order_by('-revenue')
    
    # Generate charts
    daily_chart = generate_line_chart(
        [item['date'].strftime('%Y-%m-%d') for item in daily_revenue],
        [float(item['revenue']) for item in daily_revenue],
        'Daily Revenue',
        'Date',
        'Revenue ($)'
    )
    
    court_chart = generate_bar_chart(
        [item['court__name'] for item in court_revenue],
        [float(item['revenue']) for item in court_revenue],
        'Revenue by Court',
        'Court',
        'Revenue ($)'
    )
    
    payment_chart = generate_pie_chart(
        [item['payment_method'] for item in payment_method_revenue],
        [float(item['revenue']) for item in payment_method_revenue],
        'Revenue by Payment Method'
    )
    
    context = {
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'),
        'total_revenue': total_revenue,
        'daily_revenue': daily_revenue,
        'monthly_revenue': monthly_revenue,
        'court_revenue': court_revenue,
        'payment_method_revenue': payment_method_revenue,
        'daily_chart': daily_chart,
        'court_chart': court_chart,
        'payment_chart': payment_chart,
        'total_bookings_count': total_bookings_count,
        'avg_revenue_per_booking': avg_revenue_per_booking,
    }
    
    return render(request, 'court_management/sales_report.html', context)

@login_required
@permission_required('court_management.view_employee', raise_exception=True)
def payroll_report(request, year=None, month=None):
    if year is None:
        year = timezone.now().year
    
    if month is None:
        month = timezone.now().month
    
    # Get all active employees
    employees = Employee.objects.filter(active=True)
    
    employee_data = []
    total_payroll = 0
    
    for employee in employees:
        # Get time entries for the month
        time_entries = TimeEntry.objects.filter(
            employee=employee,
            clock_in__year=year,
            clock_in__month=month,
            clock_out__isnull=False
        )
        
        # Calculate total hours and pay
        total_hours = sum(entry.duration_hours() for entry in time_entries)
        total_pay = sum(entry.calculate_pay() for entry in time_entries)
        
        employee_data.append({
            'employee': employee,
            'time_entries': time_entries,
            'total_hours': total_hours,
            'total_pay': total_pay,
        })
        
        total_payroll += total_pay
    
    context = {
        'year': year,
        'month': month,
        'month_name': calendar.month_name[month],
        'employee_data': employee_data,
        'total_payroll': total_payroll,
        'prev_month': month - 1 if month > 1 else 12,
        'prev_year': year if month > 1 else year - 1,
        'next_month': month + 1 if month < 12 else 1,
        'next_year': year if month < 12 else year + 1,
    }
    
    return render(request, 'court_management/payroll_report.html', context)

@login_required
@permission_required('court_management.view_booking', raise_exception=True)
def export_sales_report_csv(request):
    # Get date range from request or use default (last 30 days)
    end_date = timezone.now().date()
    start_date = request.GET.get('start_date')
    
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    else:
        start_date = end_date - timedelta(days=30)
    
    # Get bookings within date range
    bookings = Booking.objects.filter(
        start_time__date__gte=start_date,
        start_time__date__lte=end_date
    )
    
    # Create DataFrame
    data = {
        'Booking ID': [booking.id for booking in bookings],
        'Customer': [booking.customer.name for booking in bookings],
        'Court': [booking.court.name for booking in bookings],
        'Start Time': [booking.start_time.strftime('%Y-%m-%d %H:%M') for booking in bookings],
        'End Time': [booking.end_time.strftime('%Y-%m-%d %H:%M') for booking in bookings],
        'Duration (hours)': [booking.duration_hours() for booking in bookings],
        'Fee': [float(booking.fee) for booking in bookings],
        'Payment Status': [booking.payment_status for booking in bookings],
        'Status': [booking.status for booking in bookings],
    }
    
    df = pd.DataFrame(data)
    
    # Create HTTP response with CSV data
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="sales_report_{start_date}_to_{end_date}.csv"'
    
    df.to_csv(path_or_buf=response, index=False)
    
    return response

# Chart Generation Functions
def generate_line_chart(x_data, y_data, title, x_label, y_label):
    plt.figure(figsize=(10, 6))
    plt.plot(x_data, y_data, marker='o')
    plt.title(title)
    plt.xlabel(x_label)
    plt.ylabel(y_label)
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Convert plot to PNG image
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    
    # Convert PNG image to base64 string
    image_png = buffer.getvalue()
    buffer.close()
    
    graphic = base64.b64encode(image_png)
    graphic = graphic.decode('utf-8')
    
    plt.close()
    
    return graphic

def generate_bar_chart(x_data, y_data, title, x_label, y_label):
    plt.figure(figsize=(10, 6))
    plt.bar(x_data, y_data)
    plt.title(title)
    plt.xlabel(x_label)
    plt.ylabel(y_label)
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Convert plot to PNG image
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    
    # Convert PNG image to base64 string
    image_png = buffer.getvalue()
    buffer.close()
    
    graphic = base64.b64encode(image_png)
    graphic = graphic.decode('utf-8')
    
    plt.close()
    
    return graphic

def generate_pie_chart(labels, data, title):
    plt.figure(figsize=(8, 8))
    plt.pie(data, labels=labels, autopct='%1.1f%%')
    plt.title(title)
    
    # Convert plot to PNG image
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    
    # Convert PNG image to base64 string
    image_png = buffer.getvalue()
    buffer.close()
    
    graphic = base64.b64encode(image_png)
    graphic = graphic.decode('utf-8')
    
    plt.close()
    
    return graphic
 