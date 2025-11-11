# court_management/components/views/test_database.py

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.conf import settings

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
