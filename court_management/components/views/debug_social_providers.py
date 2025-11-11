# court_management/components/views/debug_social_providers.py
from django.http import JsonResponse
from django.conf import settings
from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp
from django.db import connection
from django.db import models  # Add this import
from allauth.socialaccount.adapter import get_adapter

def debug_social_providers(request):
    """Debug view to check for provider/provider_id mismatches"""
    
    # Get the current site
    current_site = Site.objects.get_current()
    
    # Check for any apps with provider or provider_id containing 'google'
    google_related_apps = list(SocialApp.objects.filter(
        sites__id=current_site.id
    ).filter(
        models.Q(provider__icontains='google') | models.Q(provider_id__icontains='google')
    ).values(
        'id', 'name', 'provider', 'provider_id', 'client_id'
    ))
    
    # Check all apps on the current site
    all_site_apps = list(SocialApp.objects.filter(
        sites__id=current_site.id
    ).values(
        'id', 'name', 'provider', 'provider_id', 'client_id'
    ))
    
    # Check for any apps with provider != provider_id
    mismatched_apps = [app for app in all_site_apps if app['provider'] != app['provider_id']]
    
    # Check the raw SQL query that's causing the issue
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT sa.* FROM socialaccount_socialapp sa
            INNER JOIN socialaccount_socialapp_sites sas ON sa.id = sas.socialapp_id
            WHERE sas.site_id = %s AND (sa.provider = %s OR sa.provider_id = %s)
        """, [current_site.id, 'google', 'google'])
        raw_query_result = cursor.fetchall()
    
    return JsonResponse({
        'current_site': {
            'id': current_site.id,
            'domain': current_site.domain
        },
        'google_related_apps': google_related_apps,
        'all_site_apps': all_site_apps,
        'mismatched_apps': mismatched_apps,
        'raw_query_result_count': len(raw_query_result),
        'fix_suggestion': {
            'title': "Fix Provider/Provider_ID Mismatch",
            "description": "There might be a mismatch between provider and provider_id fields. Ensure all Google apps have consistent values.",
            'command': "# Update the provider and provider_id fields to be consistent for Google apps"
        }
    })