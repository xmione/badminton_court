# court_management/components/views/clear_cache.py
# Create a temporary view to clear the cache
from django.http import HttpResponse
from django.core.cache import cache

def clear_cache_view(request):
    cache.clear()
    return HttpResponse("Cache cleared")