# court_management/management/commands/reset_posteio_db.py

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import requests
import subprocess
import time
from urllib3.exceptions import InsecureRequestWarning
import urllib3

urllib3.disable_warnings(InsecureRequestWarning)

class Command(BaseCommand):
    help = 'Reset the Poste.io database for testing purposes'

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError('This command can only be used in DEBUG mode')
        
        self.stdout.write('Resetting Poste.io to initial setup state...')
        
        # Get configuration
        api_host = getattr(settings, 'POSTE_API_HOST')
        api_user = getattr(settings, 'POSTE_API_USER')
        api_password = getattr(settings, 'POSTE_API_PASSWORD')
        container_name = getattr(settings, 'POSTE_HOSTNAME', 'mail-test')
        
        if not all([api_host, api_user, api_password]):
            raise CommandError('Poste.io configuration missing in settings')
        
        # Step 1: Delete all mailboxes
        self.stdout.write('\nStep 1: Deleting all mailboxes...')
        deleted = self._delete_all_mailboxes(api_host, api_user, api_password)
        if deleted > 0:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Deleted {deleted} mailbox(es)'))
        else:
            self.stdout.write('  No mailboxes to delete')
        
        # Step 2: Reset container data
        self.stdout.write('\nStep 2: Resetting Poste.io to setup mode...')
        if self._reset_container_data(container_name):
            self.stdout.write(self.style.SUCCESS(
                '\n✓ Poste.io has been reset to initial setup state'
            ))
            self.stdout.write(f'Navigate to {api_host} to go through setup again')
        else:
            self.stdout.write(self.style.WARNING(
                '\n⚠ Could not reset container automatically'
            ))
    
    def _delete_all_mailboxes(self, api_host, api_user, api_password):
        """Delete all mailboxes via API"""
        session = requests.Session()
        session.verify = False
        session.auth = (api_user, api_password)
        
        try:
            response = session.get(f"{api_host}/api/v1/boxes", verify=False, timeout=10)
            
            if response.status_code == 401:
                return 0
            
            if response.status_code != 200:
                return 0
            
            data = response.json()
            mailboxes = data.get('results', []) if isinstance(data, dict) else data
            
            if not mailboxes:
                return 0
            
            deleted = 0
            for mailbox in mailboxes:
                email = mailbox.get('address') if isinstance(mailbox, dict) else mailbox
                if email:
                    del_response = session.delete(f"{api_host}/api/v1/boxes/{email}", verify=False)
                    if del_response.status_code in [200, 204, 404]:
                        self.stdout.write(f'    ✓ Deleted {email}')
                        deleted += 1
            
            return deleted
            
        except Exception:
            return 0
    
    def _reset_container_data(self, container_name):
        """Reset Poste.io data without removing volumes"""
        try:
            # Stop the container
            self.stdout.write(f'  Stopping {container_name}...')
            subprocess.run(
                ['docker-compose', '--env-file', '.env.docker', 'stop', container_name],
                capture_output=True,
                check=False
            )
            
            # Clear the data inside the volume (but keep the volume itself)
            self.stdout.write(f'  Clearing Poste.io data...')
            clear_result = subprocess.run(
                [
                    'docker', 'run', '--rm',
                    '-v', 'badminton_court_poste_data:/data',
                    'busybox',
                    'sh', '-c', 
                    'rm -rf /data/* && rm -rf /data/.* 2>/dev/null || true'
                ],
                capture_output=True,
                text=True
            )
            
            if clear_result.returncode != 0:
                self.stdout.write(f'  Warning: {clear_result.stderr}')
            
            # Start the container
            self.stdout.write(f'  Starting {container_name}...')
            subprocess.run(
                ['docker-compose', '--env-file', '.env.docker', 'up', '-d', container_name],
                capture_output=True,
                check=True
            )
            
            # Wait for container to initialize
            self.stdout.write('  Waiting for Poste.io to initialize...')
            time.sleep(10)
            
            return True
            
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode() if e.stderr else str(e)
            self.stdout.write(f'  Error: {error_msg}')
            return False
        except FileNotFoundError:
            self.stdout.write('  Error: docker or docker-compose not found')
            return False