from django.urls import path
from . import views

urlpatterns = [
    path('inbox/', views.inbox, name='inbox'),
    path('email/<str:email_id>/', views.email_detail, name='email_detail'),
    path('email/<str:email_id>/delete/', views.delete_email, name='delete_email'),
    path('compose/', views.compose_email, name='compose_email'),
    path('organizations/', views.organization_list, name='organization_list'),
    path('organizations/add/', views.add_organization, name='add_organization'),
]