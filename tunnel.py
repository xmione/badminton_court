# tunnel.py

import os
import sys
import time
import argparse
import subprocess
from pyngrok import ngrok, exception
from dotenv import load_dotenv

def start_tunnel(service_name, app_port):
    # Load environment variables from .env.dev for local development
    dotenv_path = os.path.join(os.path.dirname(__file__), '.env.dev')
    load_dotenv(dotenv_path=dotenv_path)

    # Get configuration from environment variables
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

    print(f"Starting ngrok tunnel for {service_name} on port {app_port}...")
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
        
        # Save tunnel info to shared volume for other containers to use
        tunnel_info_path = os.getenv('TUNNEL_INFO_PATH', '/app/shared/tunnel_info.txt')
        with open(tunnel_info_path, 'w') as f:
            f.write(f"{public_url}\n")
        
        print(f"\n✓ Tunnel is running. Press Ctrl+C to stop.")
        print(f"Set TUNNEL_URL environment variable to: {public_url}")
        print(f"Set CYPRESS_baseUrl environment variable to: {public_url}")

        # Keep the tunnel alive
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\n🛑 Stopping tunnel...")
            ngrok.disconnect(public_url)
            ngrok.kill() # Clean up on exit as well
            print("✓ Tunnel stopped.")
            sys.exit(0)

    except exception.PyngrokNgrokError as e:
        print(f"Error starting ngrok: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Start ngrok tunnel for a specific service')
    parser.add_argument('--service', type=str, help='Service name to tunnel (web-dev or web-test)')
    parser.add_argument('--port', type=int, help='Port to tunnel')
    
    args = parser.parse_args()
    
    if not args.service or not args.port:
        print("Error: Both --service and --port must be specified")
        sys.exit(1)
    
    start_tunnel(args.service, args.port)