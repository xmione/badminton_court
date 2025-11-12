# court_management/components/views/test_database.py

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import CommandError

@csrf_exempt
@require_POST
def reset_django_database(request):
    """
    Reset the Django database for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        call_command('reset_django_db')
        return JsonResponse({'status': 'success', 'message': 'Django database reset successfully'})
    except CommandError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error during database reset: {str(e)}'}, status=500)

@csrf_exempt
@require_POST
def reset_posteio_database(request):
    """
    Reset the Poste.io database for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    try:
        call_command('reset_posteio_db')
        return JsonResponse({'status': 'success', 'message': 'Poste.io database reset successfully'})
    except CommandError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error during Posteio reset: {str(e)}'}, status=500)

@csrf_exempt
@require_POST
def reset_all_databases(request):
    """
    Reset both Django and Poste.io databases for testing purposes.
    This should only be used in development/testing environments.
    """
    if not settings.DEBUG:
        return JsonResponse({'status': 'error', 'message': 'Only available in debug mode'}, status=403)
    
    results = {
        'django': {'status': 'pending', 'message': ''},
        'posteio': {'status': 'pending', 'message': ''}
    }
    
    # Reset Django database
    try:
        call_command('reset_django_db')
        results['django'] = {'status': 'success', 'message': 'Django database reset successfully'}
    except CommandError as e:
        results['django'] = {'status': 'error', 'message': str(e)}
    except Exception as e:
        results['django'] = {'status': 'error', 'message': f'Error during Django database reset: {str(e)}'}
    
    # Reset Poste.io database
    try:
        call_command('reset_posteio_db')
        results['posteio'] = {'status': 'success', 'message': 'Poste.io database reset successfully'}
    except CommandError as e:
        results['posteio'] = {'status': 'error', 'message': str(e)}
    except Exception as e:
        results['posteio'] = {'status': 'error', 'message': f'Error during Posteio reset: {str(e)}'}
    
    # Check if both operations were successful
    if results['django']['status'] == 'success' and results['posteio']['status'] == 'success':
        return JsonResponse({
            'status': 'success', 
            'message': 'All databases reset successfully',
            'details': results
        })
    else:
        return JsonResponse({
            'status': 'partial_success', 
            'message': 'Some databases could not be reset',
            'details': results
        }, status=500)