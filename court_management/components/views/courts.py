# court_management/component/views/courts.py

from django.shortcuts import redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.contrib import messages
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend

from ..models import ( Court, Booking )
from ..forms import ( CourtForm )

from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import CreateView
from django.urls import reverse_lazy
 
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

