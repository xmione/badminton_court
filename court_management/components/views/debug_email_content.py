# court_management/components/views/debug_email_content.py

import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.contrib.auth import get_user_model
User = get_user_model()

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
