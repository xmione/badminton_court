# tunnel.py

from pyngrok import ngrok
import time
import sys
import os
from dotenv import load_dotenv

def start_ngrok_tunnel(port=8000, authtoken=None):
    print("Starting ngrok tunnel...")
    try:
        if authtoken:
            ngrok.set_auth_token(authtoken)

        tunnel = ngrok.connect(port)
        public_url = tunnel.public_url
        print(f"✓ ngrok tunnel established!")
        print(f"🌐 Public URL: {public_url}")
        print("\n✓ Tunnel is running. Press Ctrl+C to stop.")

        # --- Set environment variables for Django and Cypress ---
        os.environ['TUNNEL_URL'] = public_url  # For Django ALLOWED_HOSTS
        os.environ['CYPRESS_baseUrl'] = public_url  # For Cypress tests
        print(f"Set TUNNEL_URL environment variable to: {public_url}")
        print(f"Set CYPRESS_baseUrl environment variable to: {public_url}")

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\nStopping ngrok tunnel...")
            ngrok.disconnect(public_url)
            ngrok.kill()
            print("✓ ngrok tunnel stopped.")
    except Exception as e:
        print(f"Error starting ngrok tunnel: {e}")
        sys.exit(1)

if __name__ == "__main__":
    dotenv_path = os.path.join(os.path.dirname(__file__), '.env.tunnel')
    load_dotenv(dotenv_path=dotenv_path)

    app_port = 8000
    ngrok_auth_token = os.getenv("NGR_AUTHTOKEN")
    
    start_ngrok_tunnel(port=app_port, authtoken=ngrok_auth_token)