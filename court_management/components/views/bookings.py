# court_management/components/views/bookings.py

from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.contrib import messages
from django.utils import timezone
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend

from ..models import (
    Customer, Booking 
)
from ..forms import (
    BookingForm, PaymentForm
)

from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import CreateView
from django.urls import reverse_lazy
from django.template.loader import get_template
 
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
 