# court_management/email_backend.py
import ssl
from pathlib import Path
from django.conf import settings
from django.core.mail.backends.smtp import EmailBackend as DjangoSMTPBackend


class CustomSMTPBackend(DjangoSMTPBackend):
    def open(self):
        if self.connection:
            return False
        
        # Create SSL context with our certificate
        cert_path = Path(settings.BASE_DIR) / 'certs' / 'ca.pem'
        
        if cert_path.exists():
            ssl_context = ssl.create_default_context(cafile=str(cert_path))
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_REQUIRED
            print(f"✅ Using certificate: {cert_path}")
        else:
            # Fallback: disable verification
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            print(f"⚠️ Certificate not found, using unverified SSL")
        
        try:
            self.connection = self.connection_class(self.host, self.port, timeout=self.timeout)
            
            if self.use_tls:
                self.connection.starttls(context=ssl_context)
            
            if self.username and self.password:
                self.connection.login(self.username, self.password)
            
            return True
        except Exception as e:
            print(f"❌ SMTP Error: {e}")
            if not self.fail_silently:
                raise
            return False