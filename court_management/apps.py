from django.apps import AppConfig

class CourtManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'court_management'
    
    def ready(self):
        import court_management.signals  # Connect signals