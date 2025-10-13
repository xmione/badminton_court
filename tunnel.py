# tunnel.py

import os
import sys
import time  # Re-import time for the delay
import subprocess
from pyngrok import ngrok, exception
from dotenv import load_dotenv

def start_tunnel():
    # Load environment variables from .env.dev for local development
    dotenv_path = os.path.join(os.path.dirname(__file__), '.env.dev')
    load_dotenv(dotenv_path=dotenv_path)

    # Get configuration from environment variables
    app_port = os.getenv("APP_PORT", "8000")
    ngrok_auth_token = os.getenv("NGR_AUTHTOKEN")
    
    if not ngrok_auth_token:
        print("❌ Error: NGR_AUTHTOKEN environment variable is not set.")
        print("Please add it to your .env.dev file.")
        sys.exit(1)

    # --- KILL ALL EXISTING NGROK TUNNELS FOR A CLEAN START ---
    print("🧹 Ensuring no existing ngrok tunnels are running...")
    ngrok.kill()
    print("✓ Clean slate ensured. Waiting for ngrok to release the endpoint...")
    time.sleep(3)  # Wait for 3 seconds to ensure the endpoint is fully released
    print("✓ Ready to start a new tunnel.")

    print("Starting ngrok tunnel...")
    try:
        if ngrok_auth_token:
            ngrok.set_auth_token(ngrok_auth_token)

        # Start ngrok tunnel
        public_url = ngrok.connect(app_port, "http").public_url
        print(f"✓ ngrok tunnel established!")
        print(f"🌐 Public URL: {public_url}")

        # Set the environment variable for the current process and its children
        os.environ['TUNNEL_URL'] = public_url
        os.environ['CYPRESS_baseUrl'] = public_url
        
        print(f"\n✓ Tunnel is running. Press Ctrl+C to stop.")
        print(f"Set TUNNEL_URL environment variable to: {public_url}")
        print(f"Set CYPRESS_baseUrl environment variable to: {public_url}")

        # Start the Django development server as a subprocess
        print("\n🚀 Starting Django development server...")
        django_command = [sys.executable, "manage.py", "runserver", "0.0.0.0:8000"]
        
        # Use the current environment, which now includes TUNNEL_URL
        process = subprocess.Popen(django_command, env=os.environ.copy())
        
        # Wait for the user to stop the process
        try:
            process.wait()
        except KeyboardInterrupt:
            print("\n\n🛑 Stopping tunnel and server...")
            process.terminate()
            ngrok.disconnect(public_url)
            ngrok.kill() # Clean up on exit as well
            print("✓ Server and tunnel stopped.")
            sys.exit(0)

    except exception.PyngrokNgrokError as e:
        print(f"Error starting ngrok: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_tunnel()