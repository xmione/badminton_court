# court_management/views.py

import logging
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
from django.contrib.auth.models import User, Group
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

from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.contrib.auth.forms import UserCreationForm
from django.views.generic import CreateView
from django.urls import reverse_lazy
from django.template.loader import get_template

# Import Decimal for precise calculations
from decimal import Decimal

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.sites.models import Site
from django.conf import settings
import json

User = get_user_model()

@login_required
def index(request):
    # Get today's bookings
    today = timezone.now().date()
    
    # Check if user is a customer
    is_customer = request.user.groups.filter(name='Customers').exists()
    
    # Filter bookings based on user role
    if is_customer:
        try:
            customer = Customer.objects.get(user=request.user)
            today_bookings = Booking.objects.filter(
                start_time__date=today, 
                customer=customer
            ).order_by('start_time')
        except Customer.DoesNotExist:
            today_bookings = Booking.objects.none()
    else:
        today_bookings = Booking.objects.filter(start_time__date=today).order_by('start_time')
    
    # Get active courts
    active_courts = Court.objects.filter(active=True).count()
    
    # Get total customers
    if request.user.has_perm('court_management.view_all_customers'):
        total_customers = Customer.objects.filter(active=True).count()
    else:
        total_customers = 0
    
    # Get active employees
    if request.user.has_perm('court_management.view_all_employees'):
        active_employees = Employee.objects.filter(active=True).count()
    else:
        active_employees = 0
    
    # Get recent activities (last 5 bookings)
    if request.user.has_perm('court_management.view_all_bookings'):
        recent_bookings = Booking.objects.order_by('-created_at')[:5]
    else:
        recent_bookings = Booking.objects.none()
    
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
        'can_add_booking': request.user.has_perm('court_management.add_booking'),
        'is_customer': is_customer,
    }
    
    return render(request, 'court_management/index.html', context)

@login_required
def profile(request):
    return render(request, 'court_management/profile.html')

# Test template view for debugging
def test_template(request):
    try:
        template = get_template('account/login.html')
        return HttpResponse(f"Template found: {template.origin}")
    except Exception as e:
        return HttpResponse(f"Template not found: {str(e)}")

# Booking Views
class BookingListView(PermissionRequiredMixin, LoginRequiredMixin, ListView):
    model = Booking
    template_name = 'court_management/booking_list.html'
    context_object_name = 'bookings'
    permission_required = 'court_management.view_booking'
    
    def get_queryset(self):
        # Check if user is a customer
        self.is_customer = self.request.user.groups.filter(name='Customers').exists()
        
        # If user is a customer, only show their bookings
        if self.is_customer:
            try:
                customer = Customer.objects.get(user=self.request.user)
                return Booking.objects.filter(customer=customer).order_by('start_time')
            except Customer.DoesNotExist:
                return Booking.objects.none()
        # Staff and admin can see all bookings
        return Booking.objects.all().order_by('start_time')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Add context to indicate if user can add bookings
        context['can_add_booking'] = self.request.user.has_perm('court_management.add_booking')
        context['is_customer'] = self.is_customer
        return context

class BookingDetailView(PermissionRequiredMixin, LoginRequiredMixin, DetailView):
    model = Booking
    template_name = 'court_management/booking_detail.html'
    context_object_name = 'booking'
    permission_required = 'court_management.view_booking'
    
    def get_object(self):
        obj = super().get_object()
        # If user is a customer, check if this is their booking
        if self.request.user.groups.filter(name='Customers').exists():
            try:
                customer = Customer.objects.get(user=self.request.user)
                if obj.customer != customer:
                    from django.core.exceptions import PermissionDenied
                    raise PermissionDenied
            except Customer.DoesNotExist:
                from django.core.exceptions import PermissionDenied
                raise PermissionDenied
        return obj

# court_management/views.py (fix the BookingCreateView)

class BookingCreateView(LoginRequiredMixin, CreateView):
    model = Booking
    form_class = BookingForm
    template_name = 'court_management/booking_form.html'
    
    def dispatch(self, request, *args, **kwargs):
        # Check if user has permission to add booking
        if not request.user.has_perm('court_management.add_booking'):
            messages.error(request, "You don't have permission to create bookings.")
            return redirect('index')
        return super().dispatch(request, *args, **kwargs)
    
    def get_success_url(self):
        # If user is a customer, redirect to their bookings
        if self.request.user.groups.filter(name='Customers').exists():
            return reverse_lazy('booking-list')
        return reverse_lazy('booking-list')
    
    def form_valid(self, form):
        # If user is a customer, set the customer to their profile
        if self.request.user.groups.filter(name='Customers').exists():
            try:
                customer = Customer.objects.get(user=self.request.user)
                form.instance.customer = customer
            except Customer.DoesNotExist:
                form.add_error(None, "You don't have a customer profile.")
                return self.form_invalid(form)
        
        response = super().form_valid(form)
        messages.success(self.request, 'Booking created successfully!')
        return response
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        # Add user to form kwargs
        kwargs['user'] = self.request.user
        return kwargs
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Add customer info to context
        is_customer = self.request.user.groups.filter(name='Customers').exists()
        context['is_customer'] = is_customer
        
        if is_customer:
            try:
                customer = Customer.objects.get(user=self.request.user)
                context['customer'] = customer
            except Customer.DoesNotExist:
                pass
        return context

class BookingUpdateView(PermissionRequiredMixin, LoginRequiredMixin, UpdateView):
    model = Booking
    form_class = BookingForm
    template_name = 'court_management/booking_form.html'
    success_url = reverse_lazy('booking-list')
    permission_required = 'court_management.change_booking'
    
    def get_object(self):
        obj = super().get_object()
        # If user is a customer, check if this is their booking
        if self.request.user.groups.filter(name='Customers').exists():
            try:
                customer = Customer.objects.get(user=self.request.user)
                if obj.customer != customer:
                    from django.core.exceptions import PermissionDenied
                    raise PermissionDenied
            except Customer.DoesNotExist:
                from django.core.exceptions import PermissionDenied
                raise PermissionDenied
        return obj
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Booking updated successfully!')
        return response
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        # Add user to form kwargs
        kwargs['user'] = self.request.user
        return kwargs
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Add customer info to context
        is_customer = self.request.user.groups.filter(name='Customers').exists()
        context['is_customer'] = is_customer
        
        if is_customer:
            try:
                customer = Customer.objects.get(user=self.request.user)
                context['customer'] = customer
            except Customer.DoesNotExist:
                pass
        return context

class BookingDeleteView(PermissionRequiredMixin, LoginRequiredMixin, DeleteView):
    model = Booking
    template_name = 'court_management/booking_confirm_delete.html'
    success_url = reverse_lazy('booking-list')
    permission_required = 'court_management.delete_booking'
    
    def get_object(self):
        obj = super().get_object()
        # If user is a customer, check if this is their booking
        if self.request.user.groups.filter(name='Customers').exists():
            try:
                customer = Customer.objects.get(user=self.request.user)
                if obj.customer != customer:
                    from django.core.exceptions import PermissionDenied
                    raise PermissionDenied
            except Customer.DoesNotExist:
                from django.core.exceptions import PermissionDenied
                raise PermissionDenied
        return obj
    
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
            response = super().post(request, *args, **kwargs)
            messages.success(request, 'Booking deleted successfully!')
            return response
        except ValueError as e:
            messages.error(request, str(e))
            return redirect('booking-detail', pk=self.object.pk)

def customer_booking_history(request, customer_id):
    customer = get_object_or_404(Customer, pk=customer_id)
    
    # Check permissions
    if request.user.groups.filter(name='Customers').exists():
        try:
            user_customer = Customer.objects.get(user=request.user)
            if customer != user_customer:
                from django.core.exceptions import PermissionDenied
                raise PermissionDenied
        except Customer.DoesNotExist:
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied
    
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

@login_required
@permission_required('court_management.add_payment', raise_exception=True)
def make_payment(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    
    if request.method == 'POST':
        form = PaymentForm(request.POST)
        if form.is_valid():
            payment = form.save(commit=False)
            payment.booking = booking
            payment.processed_by = request.user
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

@login_required
@permission_required('court_management.change_booking', raise_exception=True)
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

# Customer Views
class CustomerListView(PermissionRequiredMixin, LoginRequiredMixin, ListView):
    model = Customer
    template_name = 'court_management/customer_list.html'
    context_object_name = 'customers'
    permission_required = 'court_management.view_customer'
    
    def get_queryset(self):
        # Only staff and admin can see all customers
        if self.request.user.is_staff or self.request.user.is_superuser:
            return Customer.objects.filter(active=True)
        # Customers can only see themselves
        try:
            customer = Customer.objects.get(user=self.request.user)
            return Customer.objects.filter(id=customer.id)
        except Customer.DoesNotExist:
            return Customer.objects.none()

class CustomerDetailView(PermissionRequiredMixin, LoginRequiredMixin, DetailView):
    model = Customer
    template_name = 'court_management/customer_detail.html'
    context_object_name = 'customer'
    permission_required = 'court_management.view_customer'
    
    def get_object(self):
        obj = super().get_object()
        # If user is a customer, check if this is their profile
        if self.request.user.groups.filter(name='Customers').exists():
            try:
                customer = Customer.objects.get(user=self.request.user)
                if obj.id != customer.id:
                    from django.core.exceptions import PermissionDenied
                    raise PermissionDenied
            except Customer.DoesNotExist:
                from django.core.exceptions import PermissionDenied
                raise PermissionDenied
        return obj
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get recent bookings (last 5)
        context['recent_bookings'] = Booking.objects.filter(
            customer=self.object
        ).order_by('-start_time')[:5]
        return context

class CustomerCreateView(PermissionRequiredMixin, LoginRequiredMixin, CreateView):
    model = Customer
    form_class = CustomerForm
    template_name = 'court_management/customer_form.html'
    success_url = reverse_lazy('customer-list')
    permission_required = 'court_management.add_customer'
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Customer created successfully!')
        return response

class CustomerUpdateView(PermissionRequiredMixin, LoginRequiredMixin, UpdateView):
    model = Customer
    form_class = CustomerForm
    template_name = 'court_management/customer_form.html'
    success_url = reverse_lazy('customer-list')
    permission_required = 'court_management.change_customer'
    
    def get_object(self):
        obj = super().get_object()
        # If user is a customer, check if this is their profile
        if self.request.user.groups.filter(name='Customers').exists():
            try:
                customer = Customer.objects.get(user=self.request.user)
                if obj.id != customer.id:
                    from django.core.exceptions import PermissionDenied
                    raise PermissionDenied
            except Customer.DoesNotExist:
                from django.core.exceptions import PermissionDenied
                raise PermissionDenied
        return obj
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Customer updated successfully!')
        return response

class CustomerDeleteView(PermissionRequiredMixin, LoginRequiredMixin, DeleteView):
    model = Customer
    template_name = 'court_management/customer_confirm_delete.html'
    success_url = reverse_lazy('customer-list')
    permission_required = 'court_management.delete_customer'
    
    def delete(self, request, *args, **kwargs):
        customer = self.get_object()
        customer.active = False
        customer.save()
        messages.success(request, 'Customer deactivated successfully!')
        return redirect('customer-list')

# Court Views
class CourtListView(PermissionRequiredMixin, LoginRequiredMixin, ListView):
    model = Court
    template_name = 'court_management/court_list.html'
    context_object_name = 'courts'
    permission_required = 'court_management.view_court'
    
    def get_queryset(self):
        return Court.objects.filter(active=True)

class CourtDetailView(PermissionRequiredMixin, LoginRequiredMixin, DetailView):
    model = Court
    template_name = 'court_management/court_detail.html'
    context_object_name = 'court'
    permission_required = 'court_management.view_court'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get recent bookings (last 5)
        context['recent_bookings'] = Booking.objects.filter(
            court=self.object
        ).order_by('-start_time')[:5]
        return context

class CourtCreateView(PermissionRequiredMixin, LoginRequiredMixin, CreateView):
    model = Court
    form_class = CourtForm
    template_name = 'court_management/court_form.html'
    success_url = reverse_lazy('court-list')
    permission_required = 'court_management.add_court'
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Court created successfully!')
        return response

class CourtUpdateView(PermissionRequiredMixin, LoginRequiredMixin, UpdateView):
    model = Court
    form_class = CourtForm
    template_name = 'court_management/court_form.html'
    success_url = reverse_lazy('court-list')
    permission_required = 'court_management.change_court'
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Court updated successfully!')
        return response

class CourtDeleteView(PermissionRequiredMixin, LoginRequiredMixin, DeleteView):
    model = Court
    template_name = 'court_management/court_confirm_delete.html'
    success_url = reverse_lazy('court-list')
    permission_required = 'court_management.delete_court'
    
    def delete(self, request, *args, **kwargs):
        court = self.get_object()
        court.active = False
        court.save()
        messages.success(request, 'Court deactivated successfully!')
        return redirect('court-list')

# Employee Views
class EmployeeListView(PermissionRequiredMixin, LoginRequiredMixin, ListView):
    model = Employee
    template_name = 'court_management/employee_list.html'
    context_object_name = 'employees'
    permission_required = 'court_management.view_employee'
    
    def get_queryset(self):
        return Employee.objects.filter(active=True)

class EmployeeDetailView(PermissionRequiredMixin, LoginRequiredMixin, DetailView):
    model = Employee
    template_name = 'court_management/employee_detail.html'
    context_object_name = 'employee'
    permission_required = 'court_management.view_employee'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get recent time entries (last 5)
        context['recent_time_entries'] = TimeEntry.objects.filter(
            employee=self.object
        ).order_by('-clock_in')[:5]
        return context

class EmployeeCreateView(PermissionRequiredMixin, LoginRequiredMixin, CreateView):
    model = Employee
    form_class = EmployeeForm
    template_name = 'court_management/employee_form.html'
    success_url = reverse_lazy('employee-list')
    permission_required = 'court_management.add_employee'
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Employee created successfully!')
        return response

class EmployeeUpdateView(PermissionRequiredMixin, LoginRequiredMixin, UpdateView):
    model = Employee
    form_class = EmployeeForm
    template_name = 'court_management/employee_form.html'
    success_url = reverse_lazy('employee-list')
    permission_required = 'court_management.change_employee'
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Employee updated successfully!')
        return response

class EmployeeDeleteView(PermissionRequiredMixin, LoginRequiredMixin, DeleteView):
    model = Employee
    template_name = 'court_management/employee_confirm_delete.html'
    success_url = reverse_lazy('employee-list')
    permission_required = 'court_management.delete_employee'
    
    def delete(self, request, *args, **kwargs):
        employee = self.get_object()
        employee.active = False
        employee.save()
        messages.success(request, 'Employee deactivated successfully!')
        return redirect('employee-list')

@login_required
@permission_required('court_management.change_workschedule', raise_exception=True)
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

@login_required
@permission_required('court_management.add_timeentry', raise_exception=True)
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

@login_required
@permission_required('court_management.change_timeentry', raise_exception=True)
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

# Debug view for permissions
@login_required
def debug_permissions(request):
    """Debug view to check user permissions"""
    user = request.user
    groups = user.groups.all()
    
    # Get all permissions for this user
    user_permissions = user.get_all_permissions()
    
    # Check specific permissions
    can_add_booking = user.has_perm('court_management.add_booking')
    can_view_booking = user.has_perm('court_management.view_booking')
    can_view_court = user.has_perm('court_management.view_court')
    
    context = {
        'user': user,
        'groups': groups,
        'user_permissions': user_permissions,
        'can_add_booking': can_add_booking,
        'can_view_booking': can_view_booking,
        'can_view_court': can_view_court,
    }
    
    return render(request, 'court_management/debug_permissions.html', context)

# Test API endpoints for Cypress testing
@csrf_exempt
@require_POST
def test_reset_database(request):
    """
    Reset the database for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        # Delete all data in reverse order of foreign key dependencies
        from django.apps import apps
        
        # Get all models
        all_models = apps.get_models()
        
        # Sort models by name to ensure consistent deletion order
        sorted_models = sorted(all_models, key=lambda model: model._meta.label)
        
        # Delete all instances of each model
        for model in sorted_models:
            try:
                model.objects.all().delete()
            except Exception as e:
                # Some models might not exist or have issues, continue anyway
                print(f"Error deleting {model._meta.label}: {str(e)}")
        
        # Reset migration history
        from django.core.management import call_command
        call_command('migrate', fake=True, verbosity=0)

        return JsonResponse({'status': 'success', 'message': 'Database reset successfully'})
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
        
        # Get parameters from request or environment variables (no fallbacks)
        username = data.get('username', getattr(settings, 'ADMIN_EMAIL', None))
        password = data.get('password', getattr(settings, 'ADMIN_PASSWORD', None))
        email = data.get('email', getattr(settings, 'ADMIN_EMAIL', None))
        reset = data.get('reset', True)
        
        # Debug logging
        logger = logging.getLogger(__name__)
        logger.info(f"test_setup_admin called with username: {username}, email: {email}, reset: {reset}")
        
        # Verify environment variables are set
        if not username:
            logger.error("ADMIN_EMAIL environment variable is not set")
            return JsonResponse({'status': 'error', 'message': 'ADMIN_EMAIL environment variable is not set'}, status=400)
        if not password:
            logger.error("ADMIN_PASSWORD environment variable is not set")
            return JsonResponse({'status': 'error', 'message': 'ADMIN_PASSWORD environment variable is not set'}, status=400)
        if not email:
            logger.error("ADMIN_EMAIL environment variable is not set")
            return JsonResponse({'status': 'error', 'message': 'ADMIN_EMAIL environment variable is not set'}, status=400)
        
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
        
        # CRITICAL: Handle EmailAddress for django-allauth
        try:
            from allauth.account.models import EmailAddress
            email_address, created = EmailAddress.objects.get_or_create(
                user=admin_user,
                email=email,
                defaults={'primary': True, 'verified': True}  # Ensure it's verified
            )
            if not created:
                email_address.verified = True
                email_address.primary = True
                email_address.save()
        except Exception as e:
            # Log the error but don't fail the whole request
            print(f"Error creating EmailAddress: {str(e)}")
        
        # Create additional test admin users if not already present
        if not User.objects.filter(username='superadmin').exists():
            superadmin = User.objects.create_user(
                username='superadmin',
                email=getattr(settings, 'SUPERADMIN_EMAIL'),
                password=getattr(settings, 'SUPERADMIN_PASSWORD')
            )
            superadmin.is_superuser = True
            superadmin.is_staff = True
            superadmin.save()
        
        if not User.objects.filter(username='staff_admin').exists():
            staff_admin = User.objects.create_user(
                username='staff_admin',
                email=getattr(settings, 'STAFF_ADMIN_EMAIL'),
                password=getattr(settings, 'STAFF_ADMIN_PASSWORD')
            )
            staff_admin.is_superuser = False
            staff_admin.is_staff = True
            staff_admin.save()
        
        if not User.objects.filter(username='inactive_admin').exists():
            inactive_admin = User.objects.create_user(
                username='inactive_admin',
                email=getattr(settings, 'INACTIVE_ADMIN_EMAIL'),
                password=getattr(settings, 'INACTIVE_ADMIN_PASSWORD')
            )
            inactive_admin.is_superuser = True
            inactive_admin.is_staff = True
            inactive_admin.is_active = False
            inactive_admin.save()
        
        if created:
            message = f"Admin user '{username}' created successfully"
            logger.info(message)
        else:
            message = f"Admin user '{username}' updated successfully"
            logger.info(message)
            
        return JsonResponse({'status': 'success', 'message': message})
    except Exception as e:
        logger.error(f"Error in test_setup_admin: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
@csrf_exempt
@require_POST
def get_verification_token(request):
    """
    Get or create a verification token for testing purposes.
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
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'User not found'}, status=404)
        
        # Import django-allauth models and utilities
        from allauth.account.models import EmailAddress, EmailConfirmation
        from django.utils import timezone
        
        # Get or create the email address
        email_address, created = EmailAddress.objects.get_or_create(
            user=user,
            email=email,
            defaults={'primary': True, 'verified': False}
        )
        
        # If already verified, return success
        if email_address.verified:
            return JsonResponse({
                'status': 'success',
                'token': 'already_verified',
                'message': 'Email already verified',
                'verified': True
            })
        
        # CRITICAL: Delete ALL existing confirmations for this email
        # Old confirmations can interfere with new ones
        deleted_count = EmailConfirmation.objects.filter(email_address=email_address).delete()[0]
        if deleted_count > 0:
            print(f"Deleted {deleted_count} old confirmation(s) for {email}")
        
        # Create a NEW confirmation record
        confirmation = EmailConfirmation.create(email_address)
        
        # IMPORTANT: Set sent timestamp BEFORE saving
        # This is required for the confirmation to be valid
        confirmation.sent = timezone.now()
        confirmation.save()
        
        # Verify the confirmation was created properly
        if not confirmation.key:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to generate confirmation key'
            }, status=500)
        
        # Double-check it's in the database
        try:
            EmailConfirmation.objects.get(key=confirmation.key)
        except EmailConfirmation.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Confirmation was not saved to database'
            }, status=500)
        
        return JsonResponse({
            'status': 'success',
            'token': confirmation.key,
            'verified': False,
            'email': email,
            'created_at': confirmation.created.isoformat(),
            'sent_at': confirmation.sent.isoformat() if confirmation.sent else None,
            'user_id': user.id
        })
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_verification_token: {str(e)}")
        print(error_trace)
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'trace': error_trace if settings.DEBUG else None
        }, status=500)

# Add this to your views.py for testing cleanup

@csrf_exempt
@require_POST
def test_cleanup_user(request):
    """
    Clean up a specific user and their email confirmations for testing.
    Only available in DEBUG mode.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
        
        # Import django-allauth models
        from allauth.account.models import EmailAddress, EmailConfirmation
        
        # Delete user and all related data
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
            
            # Delete email confirmations
            email_addresses = EmailAddress.objects.filter(user=user)
            for email_addr in email_addresses:
                EmailConfirmation.objects.filter(email_address=email_addr).delete()
            
            # Delete email addresses
            email_addresses.delete()
            
            # Delete user
            user.delete()
            
            return JsonResponse({'status': 'success', 'message': f'User {email} cleaned up successfully'})
        except User.DoesNotExist:
            return JsonResponse({'status': 'success', 'message': 'User not found (already clean)'})
            
    except Exception as e:
        import traceback
        print(f"Error in test_cleanup_user: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@csrf_exempt
def debug_confirmation_status(request, token):
    """
    Debug endpoint to check if a confirmation token is valid.
    Only available in DEBUG mode.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        from allauth.account.models import EmailConfirmation
        from django.utils import timezone
        
        # Try to find the confirmation
        try:
            confirmation = EmailConfirmation.objects.get(key=token)
            
            # Check if it's expired
            is_expired = confirmation.key_expired()
            
            return JsonResponse({
                'status': 'success',
                'token_exists': True,
                'token': token,
                'email': confirmation.email_address.email,
                'user_id': confirmation.email_address.user.id,
                'created': confirmation.created.isoformat(),
                'sent': confirmation.sent.isoformat() if confirmation.sent else None,
                'is_expired': is_expired,
                'email_verified': confirmation.email_address.verified,
                'current_time': timezone.now().isoformat()
            })
        except EmailConfirmation.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'token_exists': False,
                'token': token,
                'message': 'Confirmation token not found in database'
            })
            
    except Exception as e:
        import traceback
        return JsonResponse({
            'status': 'error',
            'message': str(e),
            'trace': traceback.format_exc()
        }, status=500)
        
@csrf_exempt
@require_http_methods(["POST"])
def debug_check_confirmation(request):
    """
    Debug function to check if email confirmation exists for a user
    """
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        user = User.objects.get(email=email)
        from allauth.account.models import EmailAddress, EmailConfirmation
        
        email_address = EmailAddress.objects.filter(user=user, email=email).first()
        if not email_address:
            return JsonResponse({'status': 'error', 'message': 'Email address not found'})
        
        confirmations = EmailConfirmation.objects.filter(email_address=email_address)
        confirmation_data = []
        for conf in confirmations:
            confirmation_data.append({
                'id': conf.id,
                'created': conf.created.isoformat(),
                'key': conf.key,
                'sent': conf.sent.isoformat() if conf.sent else None,
                'expired': conf.key_expired()
            })
        
        return JsonResponse({
            'status': 'success', 
            'email_address_id': email_address.id,
            'email_verified': email_address.verified,
            'confirmations': confirmation_data
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})
    
@csrf_exempt
@require_http_methods(["POST"])
def update_site_domain(request):
    """
    API endpoint to update the Site domain and name.
    This is used by Cypress tests to ensure the correct domain is set.
    """
    try:
        data = json.loads(request.body)
        domain = data.get('domain')
        name = data.get('name')
        
        if not domain or not name:
            return JsonResponse({
                'error': 'Both domain and name are required'
            }, status=400)
        
        # Get or create the site with the configured SITE_ID
        site, created = Site.objects.get_or_create(
            id=settings.SITE_ID,
            defaults={
                'domain': domain,
                'name': name
            }
        )
        
        # Update if it already existed
        if not created:
            site.domain = domain
            site.name = name
            site.save()
        
        action = 'created' if created else 'updated'
        
        return JsonResponse({
            'message': f'Site successfully {action}',
            'site_id': site.id,
            'domain': site.domain,
            'name': site.name
        }, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)
    
@csrf_exempt
@require_http_methods(["POST"])
def update_all_site_domains(request):
    """
    Update ALL Site objects in the database to ensure django-allauth uses the correct domain.
    """
    try:
        data = json.loads(request.body)
        domain = data.get('domain')
        name = data.get('name')
        
        if not domain or not name:
            return JsonResponse({
                'error': 'Both domain and name are required'
            }, status=400)
        
        # Update ALL Site objects, not just the one with SITE_ID
        from django.contrib.sites.models import Site
        sites = Site.objects.all()
        updated_count = 0
        
        for site in sites:
            site.domain = domain
            site.name = name
            site.save()
            updated_count += 1
        
        # Also update the default site if no sites exist
        if updated_count == 0:
            Site.objects.create(domain=domain, name=name)
            updated_count = 1
        
        return JsonResponse({
            'message': f'All {updated_count} site domain(s) updated successfully',
            'updated_count': updated_count,
            'domain': domain,
            'name': name
        }, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)
    
@csrf_exempt
@require_http_methods(["POST"])
def check_pending_emails(request):
    """
    Check for pending verification emails in the database.
    """
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)
        
        # Check django-allauth email confirmations
        from allauth.account.models import EmailAddress, EmailConfirmation
        from django.utils import timezone
        
        emails_data = []
        need_manual_send = False
        
        try:
            user = User.objects.get(email=email)
            email_address = EmailAddress.objects.filter(user=user, email=email).first()
            
            if email_address:
                # Get all confirmations for this email
                confirmations = EmailConfirmation.objects.filter(
                    email_address=email_address
                ).order_by('-created')
                
                for conf in confirmations:
                    emails_data.append({
                        'id': conf.id,
                        'key': conf.key,
                        'created': conf.created.isoformat(),
                        'sent': conf.sent.isoformat() if conf.sent else None,
                        'expired': conf.key_expired(),
                        'email_verified': email_address.verified
                    })
                
                # Check if we need to manually send
                if confirmations and not any(conf.sent for conf in confirmations):
                    need_manual_send = True
                    
        except User.DoesNotExist:
            pass
        
        return JsonResponse({
            'emails': emails_data,
            'need_manual_send': need_manual_send,
            'email_found': len(emails_data) > 0
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def send_pending_emails(request):
    """
    Manually send pending verification emails.
    """
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)
        
        # Import django-allauth utilities
        from allauth.account.models import EmailAddress, EmailConfirmation
        from allauth.account import app_settings as account_settings
        from allauth.account.adapter import get_adapter
        from django.utils import timezone
        
        try:
            user = User.objects.get(email=email)
            email_address = EmailAddress.objects.filter(user=user, email=email).first()
            
            if not email_address:
                return JsonResponse({'error': 'Email address not found'}, status=404)
            
            if email_address.verified:
                return JsonResponse({'message': 'Email already verified'})
            
            # Get the most recent unsent confirmation or create one
            confirmation = EmailConfirmation.objects.filter(
                email_address=email_address,
                sent__isnull=True
            ).first()
            
            if not confirmation:
                # Create a new confirmation
                confirmation = EmailConfirmation.create(email_address)
                confirmation.sent = timezone.now()
                confirmation.save()
            
            # Manually send the confirmation email
            adapter = get_adapter()
            adapter.send_confirmation_mail(request, confirmation, signup=True)
            
            # Mark as sent
            confirmation.sent = timezone.now()
            confirmation.save()
            
            return JsonResponse({
                'message': 'Verification email sent manually',
                'confirmation_id': confirmation.id,
                'key': confirmation.key
            })
            
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
@require_http_methods(["POST"])
def debug_site_config(request):
    """Debug endpoint to check site configuration"""
    from django.contrib.sites.models import Site
    from django.conf import settings
    
    site = Site.objects.get_current()
    
    return JsonResponse({
        'site_id': settings.SITE_ID,
        'site_domain': site.domain,
        'site_name': site.name,
        'default_from_email': settings.DEFAULT_FROM_EMAIL,
        'account_email_subject_prefix': getattr(settings, 'ACCOUNT_EMAIL_SUBJECT_PREFIX', 'Not set'),
    })

@csrf_exempt
@require_http_methods(["POST"])
def debug_email_content(request):
    """Debug endpoint to see what email content would be generated"""
    from allauth.account.adapter import get_adapter
    from django.contrib.sites.models import Site
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    site = Site.objects.get_current()
    adapter = get_adapter()
    
    data = json.loads(request.body)
    email = data.get('email')
    
    # Create a mock context similar to what allauth uses
    context = {
        'user': User(email=email, username=email),
        'current_site': site,
        'activate_url': f"http://{site.domain}/accounts/confirm-email/test-key/",
        'key': 'test-key',
    }
    
    # Try to render the email templates
    try:
        subject = "Test Subject"
        message = "Test Message"
        
        # This is how allauth renders emails internally
        from django.template.loader import render_to_string
        
        subject_template = 'account/email/email_confirmation_subject'
        message_template = 'account/email/email_confirmation_message'
        
        subject = render_to_string(subject_template, context).strip()
        message = render_to_string(message_template, context)
        
    except Exception as e:
        subject = f"Error: {str(e)}"
        message = f"Error: {str(e)}"
    
    return JsonResponse({
        'generated_subject': subject,
        'generated_message': message,
        'context_used': {
            'site_domain': site.domain,
            'site_name': site.name,
            'user_email': email,
        }
    })

@csrf_exempt
@require_http_methods(["POST"])
def test_create_admin_group(request):
    """
    Create or update an Administrators group with all permissions for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        from django.contrib.auth.models import Group, Permission
        from django.contrib.contenttypes.models import ContentType
        from court_management.models import (
            Customer, Court, Booking, Payment, 
            Employee, WorkSchedule, TimeEntry
        )
        
        # Get or create the Administrators group
        group, created = Group.objects.get_or_create(name='Administrators')
        
        # Get all content types for our models
        content_types = ContentType.objects.get_for_models(
            Customer, Court, Booking, Payment, 
            Employee, WorkSchedule, TimeEntry
        ).values()
        
        # Get all permissions for these content types
        permissions = Permission.objects.filter(content_type__in=content_types)
        
        # Add all permissions to the group
        group.permissions.set(permissions)
        
        if created:
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group created successfully with all permissions'
            })
        else:
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group updated successfully with all permissions'
            })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def test_delete_admin_group(request):
    """
    Delete an Administrators group for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        from django.contrib.auth.models import Group
        
        # Try to get the Administrators group
        try:
            group = Group.objects.get(name='Administrators')
            group.delete()
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group deleted successfully'
            })
        except Group.DoesNotExist:
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group does not exist'
            })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)
    """
    Delete an Administrators group for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        from django.contrib.auth.models import Group
        
        # Try to get the Administrators group
        try:
            group = Group.objects.get(name='Administrators')
            group.delete()
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group deleted successfully'
            })
        except Group.DoesNotExist:
            return JsonResponse({
                'status': 'success', 
                'message': 'Administrators group does not exist'
            })
            
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)