# court_management/components/views/employees.py

from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.contrib import messages
from django.utils import timezone
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend

import calendar

from ..models import ( Employee, WorkSchedule, TimeEntry )
from ..forms import ( EmployeeForm )

from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import CreateView
from django.urls import reverse_lazy

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

