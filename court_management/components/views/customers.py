# court_management/components/views/customers.py

from django.shortcuts import redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.contrib import messages
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend

from ..models import ( Customer, Booking )
from ..forms import ( CustomerForm )

from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import CreateView
from django.urls import reverse_lazy

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

