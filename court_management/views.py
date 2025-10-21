# court_management/views.py

from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.contrib import messages
from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate, TruncMonth
from django.http import HttpResponse
from django.conf import settings
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend

import matplotlib.pyplot as plt
import io
import base64
import pandas as pd
import calendar
from datetime import datetime, timedelta
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.db import connection
from django.core.management import call_command
import json

from .models import (
    Customer, Court, Booking, Payment, 
    Employee, WorkSchedule, TimeEntry
)
from .forms import (
    BookingForm, PaymentForm, 
    EmployeeForm, WorkScheduleForm, TimeEntryForm,
    CustomerForm, CourtForm
)

from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.forms import UserCreationForm
from django.views.generic import CreateView
from django.urls import reverse_lazy
from django.template.loader import get_template

# Import Decimal for precise calculations
from decimal import Decimal

User = get_user_model()

@login_required
def index(request):
    # Get today's bookings
    today = timezone.now().date()
    today_bookings = Booking.objects.filter(start_time__date=today).order_by('start_time')
    
    # Get active courts
    active_courts = Court.objects.filter(active=True).count()
    
    # Get total customers
    total_customers = Customer.objects.filter(active=True).count()
    
    # Get active employees
    active_employees = Employee.objects.filter(active=True).count()
    
    # Get recent activities (last 5 bookings)
    recent_bookings = Booking.objects.order_by('-created_at')[:5]
    
    # Format recent activities for display
    recent_activities = []
    for booking in recent_bookings:
        activity = {
            'title': f"New booking by {booking.customer.name}",
            'description': f"Court {booking.court.name} at {booking.start_time.strftime('%Y-%m-%d %H:%M')}",
            'timestamp': booking.created_at
        }
        recent_activities.append(activity)
    
    context = {
        'today_bookings': today_bookings,
        'active_courts': active_courts,
        'total_customers': total_customers,
        'active_employees': active_employees,
        'recent_activities': recent_activities,
    }
    
    return render(request, 'court_management/index.html', context)


@csrf_exempt
@require_POST
def get_verification_token(request):
    """
    Retrieve the email verification token for a user.
    The token is stored on a related EmailConfirmation object, not the EmailAddress itself.
    """
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
        
        # Get the user
        user = User.objects.get(email=email)
        
        # Import django-allauth models
        from allauth.account.models import EmailAddress, EmailConfirmation
        
        # Get the email address object that was created during registration
        email_address = EmailAddress.objects.get(user=user, email=email)
        
        # *** THE FIX IS HERE ***
        # The token is on a related EmailConfirmation object.
        # We get the most recent confirmation record for this email address.
        try:
            confirmation = email_address.emailconfirmation_set.latest('created')
            token = confirmation.key
        except EmailConfirmation.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'No confirmation record found for this email.'}, status=404)
        
        return JsonResponse({'status': 'success', 'token': token})
    except User.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'User not found'}, status=404)
    except EmailAddress.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Email address not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

class SignUpView(CreateView):
    form_class = UserCreationForm
    success_url = reverse_lazy('account_login')  # Fixed: use 'account_login' instead of 'login'
    template_name = 'court_management/signup.html'  # Updated template path

@login_required
def profile(request):
    return render(request, 'court_management/profile.html')  # Updated template path

# Test template view for debugging
def test_template(request):
    try:
        template = get_template('account/login.html')
        return HttpResponse(f"Template found: {template.origin}")
    except Exception as e:
        return HttpResponse(f"Template not found: {str(e)}")

# Booking Views
class BookingListView(LoginRequiredMixin, ListView):
    model = Booking
    template_name = 'court_management/booking_list.html'
    context_object_name = 'bookings'
    
    def get_queryset(self):
        return Booking.objects.all().order_by('start_time')

class BookingDetailView(LoginRequiredMixin, DetailView):
    model = Booking
    template_name = 'court_management/booking_detail.html'
    context_object_name = 'booking'

class BookingCreateView(LoginRequiredMixin, CreateView):
    model = Booking
    form_class = BookingForm
    template_name = 'court_management/booking_form.html'
    success_url = reverse_lazy('booking-list')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Booking created successfully!')
        return response

class BookingUpdateView(LoginRequiredMixin, UpdateView):
    model = Booking
    form_class = BookingForm
    template_name = 'court_management/booking_form.html'
    success_url = reverse_lazy('booking-list')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Booking updated successfully!')
        return response

class BookingDeleteView(LoginRequiredMixin, DeleteView):
    model = Booking
    template_name = 'court_management/booking_confirm_delete.html'
    success_url = reverse_lazy('booking-list')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        booking = self.object
        
        # Add validation flags to context
        context['can_delete'] = (
            booking.payment_status != 'paid' and 
            booking.start_time >= timezone.now()
        )
        context['delete_blocked_reason'] = self.get_delete_blocked_reason(booking)
        
        return context
    
    def get_delete_blocked_reason(self, booking):
        if booking.payment_status == 'paid':
            return 'This booking has been paid for and cannot be deleted.'
        elif booking.start_time < timezone.now():
            return 'This booking is in the past and cannot be deleted.'
        return None
    
    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        
        # Double-check validation before attempting deletion
        if self.object.payment_status == 'paid':
            messages.error(request, 'Cannot delete a paid booking. Please contact administrator for assistance.')
            return redirect('booking-detail', pk=self.object.pk)
        
        if self.object.start_time < timezone.now():
            messages.error(request, 'Cannot delete past bookings.')
            return redirect('booking-detail', pk=self.object.pk)
        
        try:
            return super().post(request, *args, **kwargs)
        except ValueError as e:
            messages.error(request, str(e))
            return redirect('booking-detail', pk=self.object.pk)
                
def customer_booking_history(request, customer_id):
    customer = get_object_or_404(Customer, pk=customer_id)
    bookings = Booking.objects.filter(customer=customer).order_by('-start_time')
    
    # Calculate statistics
    total_spent = sum(booking.fee for booking in bookings)
    total_hours = sum(booking.duration_hours() for booking in bookings)
    avg_duration = total_hours / bookings.count() if bookings.count() > 0 else 0
    
    context = {
        'customer': customer,
        'bookings': bookings,
        'total_spent': total_spent,
        'avg_duration': avg_duration,
    }
    return render(request, 'court_management/customer_booking_history.html', context)

def make_payment(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    
    if request.method == 'POST':
        form = PaymentForm(request.POST)
        if form.is_valid():
            payment = form.save(commit=False)
            payment.booking = booking
            payment.save()
            
            # Update booking payment status
            booking.payment_status = 'paid'
            booking.save()
            
            messages.success(request, 'Payment processed successfully!')
            return redirect('booking-detail', pk=booking.pk)
    else:
        form = PaymentForm(initial={'amount': booking.fee})
    
    context = {
        'form': form,
        'booking': booking,
    }
    return render(request, 'court_management/make_payment.html', context)

# Customer Views
class CustomerListView(LoginRequiredMixin, ListView):
    model = Customer
    template_name = 'court_management/customer_list.html'
    context_object_name = 'customers'
    
    def get_queryset(self):
        return Customer.objects.filter(active=True)

class CustomerDetailView(LoginRequiredMixin, DetailView):
    model = Customer
    template_name = 'court_management/customer_detail.html'
    context_object_name = 'customer'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get recent bookings (last 5)
        context['recent_bookings'] = Booking.objects.filter(
            customer=self.object
        ).order_by('-start_time')[:5]
        return context
    
class CustomerCreateView(LoginRequiredMixin, CreateView):
    model = Customer
    form_class = CustomerForm
    template_name = 'court_management/customer_form.html'
    success_url = reverse_lazy('customer-list')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Customer created successfully!')
        return response

class CustomerUpdateView(LoginRequiredMixin, UpdateView):
    model = Customer
    form_class = CustomerForm
    template_name = 'court_management/customer_form.html'
    success_url = reverse_lazy('customer-list')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Customer updated successfully!')
        return response

class CustomerDeleteView(LoginRequiredMixin, DeleteView):
    model = Customer
    template_name = 'court_management/customer_confirm_delete.html'
    success_url = reverse_lazy('customer-list')
    
    def delete(self, request, *args, **kwargs):
        customer = self.get_object()
        customer.active = False
        customer.save()
        messages.success(request, 'Customer deactivated successfully!')
        return redirect('customer-list')

# Court Views
class CourtListView(LoginRequiredMixin, ListView):
    model = Court
    template_name = 'court_management/court_list.html'
    context_object_name = 'courts'
    
    def get_queryset(self):
        return Court.objects.filter(active=True)

class CourtDetailView(LoginRequiredMixin, DetailView):
    model = Court
    template_name = 'court_management/court_detail.html'
    context_object_name = 'court'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get recent bookings (last 5)
        context['recent_bookings'] = Booking.objects.filter(
            court=self.object
        ).order_by('-start_time')[:5]
        return context
    
class CourtCreateView(LoginRequiredMixin, CreateView):
    model = Court
    form_class = CourtForm
    template_name = 'court_management/court_form.html'
    success_url = reverse_lazy('court-list')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Court created successfully!')
        return response

class CourtUpdateView(LoginRequiredMixin, UpdateView):
    model = Court
    form_class = CourtForm
    template_name = 'court_management/court_form.html'
    success_url = reverse_lazy('court-list')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Court updated successfully!')
        return response

class CourtDeleteView(LoginRequiredMixin, DeleteView):
    model = Court
    template_name = 'court_management/court_confirm_delete.html'
    success_url = reverse_lazy('court-list')
    
    def delete(self, request, *args, **kwargs):
        court = self.get_object()
        court.active = False
        court.save()
        messages.success(request, 'Court deactivated successfully!')
        return redirect('court-list')

# Employee Views
class EmployeeListView(LoginRequiredMixin, ListView):
    model = Employee
    template_name = 'court_management/employee_list.html'
    context_object_name = 'employees'
    
    def get_queryset(self):
        return Employee.objects.filter(active=True)

class EmployeeDetailView(LoginRequiredMixin, DetailView):
    model = Employee
    template_name = 'court_management/employee_detail.html'
    context_object_name = 'employee'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get recent time entries (last 5)
        context['recent_time_entries'] = TimeEntry.objects.filter(
            employee=self.object
        ).order_by('-clock_in')[:5]
        return context

class EmployeeCreateView(LoginRequiredMixin, CreateView):
    model = Employee
    form_class = EmployeeForm
    template_name = 'court_management/employee_form.html'
    success_url = reverse_lazy('employee-list')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Employee created successfully!')
        return response

class EmployeeUpdateView(LoginRequiredMixin, UpdateView):
    model = Employee
    form_class = EmployeeForm
    template_name = 'court_management/employee_form.html'
    success_url = reverse_lazy('employee-list')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Employee updated successfully!')
        return response

class EmployeeDeleteView(LoginRequiredMixin, DeleteView):
    model = Employee
    template_name = 'court_management/employee_confirm_delete.html'
    success_url = reverse_lazy('employee-list')
    
    def delete(self, request, *args, **kwargs):
        employee = self.get_object()
        employee.active = False
        employee.save()
        messages.success(request, 'Employee deactivated successfully!')
        return redirect('employee-list')

def employee_schedule(request, employee_id, year=None, month=None):
    employee = get_object_or_404(Employee, pk=employee_id)
    
    if year is None:
        year = timezone.now().year
    
    if month is None:
        month = timezone.now().month
    
    # Get work schedules for the month
    schedules = WorkSchedule.objects.filter(
        employee=employee,
        date__year=year,
        date__month=month
    ).order_by('date', 'start_time')
    
    # Get time entries for the month
    time_entries = TimeEntry.objects.filter(
        employee=employee,
        clock_in__year=year,
        clock_in__month=month
    ).order_by('clock_in')
    
    # Calculate total hours worked
    total_hours = sum(entry.duration_hours() for entry in time_entries if entry.clock_out)
    
    # Calculate total pay
    total_pay = sum(entry.calculate_pay() for entry in time_entries if entry.clock_out)
    
    # Create calendar
    cal = calendar.monthcalendar(year, month)
    
    # Create schedule dictionary for calendar
    schedule_dict = {}
    for schedule in schedules:
        day = schedule.date.day
        if day not in schedule_dict:
            schedule_dict[day] = []
        schedule_dict[day].append(schedule)
    
    # Create time entry dictionary for calendar
    time_entry_dict = {}
    for entry in time_entries:
        day = entry.clock_in.day
        if day not in time_entry_dict:
            time_entry_dict[day] = []
        time_entry_dict[day].append(entry)
    
    context = {
        'employee': employee,
        'year': year,
        'month': month,
        'month_name': calendar.month_name[month],
        'cal': cal,
        'schedules': schedules,
        'time_entries': time_entries,
        'total_hours': total_hours,
        'total_pay': total_pay,
        'schedule_dict': schedule_dict,
        'time_entry_dict': time_entry_dict,
        'prev_month': month - 1 if month > 1 else 12,
        'prev_year': year if month > 1 else year - 1,
        'next_month': month + 1 if month < 12 else 1,
        'next_year': year if month < 12 else year + 1,
    }
    
    return render(request, 'court_management/employee_schedule.html', context)

def clock_in(request, employee_id):
    employee = get_object_or_404(Employee, pk=employee_id)
    
    # Check if employee has an active time entry (clocked in but not out)
    active_entry = TimeEntry.objects.filter(
        employee=employee,
        clock_out__isnull=True
    ).first()
    
    if active_entry:
        messages.error(request, 'You are already clocked in!')
        return redirect('employee-detail', pk=employee.pk)
    
    # Create new time entry
    time_entry = TimeEntry.objects.create(
        employee=employee,
        clock_in=timezone.now(),
        notes=request.POST.get('notes', '')
    )
    
    messages.success(request, 'Clocked in successfully!')
    return redirect('employee-detail', pk=employee.pk)

def clock_out(request, employee_id):
    employee = get_object_or_404(Employee, pk=employee_id)
    
    # Find active time entry
    active_entry = TimeEntry.objects.filter(
        employee=employee,
        clock_out__isnull=True
    ).first()
    
    if not active_entry:
        messages.error(request, 'You are not clocked in!')
        return redirect('employee-detail', pk=employee.pk)
    
    # Update time entry
    active_entry.clock_out = timezone.now()
    active_entry.notes += f"\nClock out notes: {request.POST.get('notes', '')}"
    active_entry.save()
    
    messages.success(request, 'Clocked out successfully!')
    return redirect('employee-detail', pk=employee.pk)

# Report Views
@login_required
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
    total_revenue = bookings.aggregate(total=Sum('fee'))['total'] or Decimal('0.00') # Ensure Decimal type
    
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
        'total_bookings_count': total_bookings_count, # Pass the total bookings count
        'avg_revenue_per_booking': avg_revenue_per_booking, # Pass the calculated average
    }
    
    return render(request, 'court_management/sales_report.html', context)

@login_required
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

# Test API endpoints for Cypress testing
@csrf_exempt
@require_POST
def test_reset_database(request):
    """
    Reset the database for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'public message': 'Only available in debug mode'}, status=403)
    
    try:
        # Get a cursor to perform raw SQL
        from django.db import connection
        
        # Disable foreign key checks temporarily
        cursor = connection.cursor()
        
        try:
            # --- THIS IS THE CORRECTED COMMAND ---
            # Drop all schemas, including extensions like django_content_type
            cursor.execute("""
                DROP SCHEMA IF EXISTS CASCADE;
                DROP EXTENSION IF EXISTS CASCADE;
            """)
        finally:
            # --- THIS IS THE CRITICAL STEP ---
            # ALWAYS close the cursor when you're done with it
            cursor.close()
        
        # Delete all user-related data directly
        User.objects.all().delete()
        
        # Delete allauth email addresses
        from allauth.account.models import EmailAddress
        EmailAddress.objects.all().drop()
        
        # Delete allauth social accounts
        from allauth.socialaccount.models import SocialAccount, SocialToken
        SocialAccount.objects.all().delete()
        SocialToken.objects.all().delete()
        
        # Delete any sessions
        from django.contrib.sessions.models import Session
        Session.objects.all().delete()
        
        # Reset migration history to get a truly clean state
        from django.core.management import call_command
        call_command('migrate', fake=True, verbosity=0)

        return JsonResponse({'status': 'success', 'message': 'Database, schemas, and migration history reset successfully'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error during database reset: {str(e)}'}, status=500)

@csrf_exempt
@require_POST
def test_create_user(request):
    """
    Create a verified user for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({'status': 'error', 'message': 'Email and password are required'}, status=400)
        
        # Check if user already exists first
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(username=email)
            # User exists, just update password and ensure active
            user.set_password(password)
            user.is_active = True
            user.save()
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create_user(username=email, email=email, password=password)
        
        # Handle EmailAddress for django-allauth
        try:
            from allauth.account.models import EmailAddress
            email_address, created = EmailAddress.objects.get_or_create(
                user=user,
                email=email,
                defaults={'primary': True, 'verified': True}
            )
            if not created:
                email_address.verified = True
                email_address.primary = True
                email_address.save()
        except Exception as e:
            # Log the error but don't fail the whole request
            print(f"Error creating EmailAddress: {str(e)}")
        
        return JsonResponse({'status': 'success', 'message': 'User created successfully'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
@csrf_exempt
@require_POST
def test_verify_user(request):
    """
    Verify a user for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
        
        # Find and verify the user
        user = User.objects.get(email=email)
        user.is_active = True
        user.save()
        
        return JsonResponse({'status': 'success', 'message': 'User verified successfully'})
    except User.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
@csrf_exempt
@require_POST
def test_setup_admin(request):
    """
    Setup test admin users for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        # Parse request body for options
        data = json.loads(request.body) if request.body else {}
        
        # Get parameters
        username = data.get('username', 'admin')
        password = data.get('password', 'password')
        email = data.get('email', 'admin@example.com')
        reset = data.get('reset', False)
        
        # Reset existing admin if requested
        if reset:
            User.objects.filter(username__in=['admin', 'superadmin', 'staff_admin', 'inactive_admin']).delete()
        
        # Create the main admin user
        admin_user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_superuser': True,
                'is_staff': True,
                'is_active': True,
            }
        )
        
        # Always set the password to ensure it's correct
        admin_user.set_password(password)
        admin_user.save()
        
        # Create additional test admin users if not already present
        if not User.objects.filter(username='superadmin').exists():
            superadmin = User.objects.create_user(
                username='superadmin',
                email='superadmin@example.com',
                password='superpassword'
            )
            superadmin.is_superuser = True
            superadmin.is_staff = True
            superadmin.save()
        
        if not User.objects.filter(username='staff_admin').exists():
            staff_admin = User.objects.create_user(
                username='staff_admin',
                email='staff@example.com',
                password='staffpassword'
            )
            staff_admin.is_superuser = False
            staff_admin.is_staff = True
            staff_admin.save()
        
        if not User.objects.filter(username='inactive_admin').exists():
            inactive_admin = User.objects.create_user(
                username='inactive_admin',
                email='inactive@example.com',
                password='inactivepassword'
            )
            inactive_admin.is_superuser = True
            inactive_admin.is_staff = True
            inactive_admin.is_active = False
            inactive_admin.save()
        
        if created:
            message = f"Admin user '{username}' created successfully"
        else:
            message = f"Admin user '{username}' updated successfully"
            
        return JsonResponse({'status': 'success', 'message': message})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
@csrf_exempt
@require_POST
def test_get_verification_token(request):
    """
    Generate and return the email verification token for a user.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
        
        # Get the user
        user = User.objects.get(email=email)
        
        # Import django-allauth models
        from allauth.account.models import EmailAddress
        from allauth.account.utils import generate_token
        
        # Get or create the email address
        email_address, created = EmailAddress.objects.get_or_create(
            user=user,
            email=email,
            defaults={'primary': True}
        )
        
        # Generate the verification token
        token = generate_token(email_address)
        
        return JsonResponse({'status': 'success', 'token': token})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)        
    
@login_required
def cancel_booking(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    
    # Prevent cancellation of paid bookings
    if booking.payment_status == 'paid':
        messages.error(request, 'Cannot cancel a paid booking. Please contact administrator for refund assistance.')
        return redirect('booking-detail', pk=booking.pk)
    
    # Prevent cancellation of past bookings
    if booking.start_time < timezone.now():
        messages.error(request, 'Cannot cancel past bookings.')
        return redirect('booking-detail', pk=booking.pk)
    
    # Mark as cancelled instead of deleting
    booking.status = 'cancelled'
    booking.save()
    
    messages.success(request, 'Booking cancelled successfully!')
    return redirect('booking-detail', pk=booking.pk)    