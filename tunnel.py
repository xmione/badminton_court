# tunnel.py

from pyngrok import ngrok
import time
import sys
import os
from dotenv import load_dotenv # Import load_dotenv

def start_ngrok_tunnel(port=8000, authtoken=None, subdomain=None):
    print("Starting ngrok tunnel...")
    try:
        # Set authtoken if provided
        if authtoken:
            ngrok.set_auth_token(authtoken)
        else:
            print("No authtoken provided. Will attempt to use pre-configured token or environment variable.")

        # Build ngrok connection options
        ngrok_options = {}
        if subdomain:
            ngrok_options['subdomain'] = subdomain
            print(f"Using custom subdomain: {subdomain}")

        # Connect to the specified port
        tunnel = ngrok.connect(port, **ngrok_options)
        print(f"✓ ngrok tunnel established!")
        print(f"🌐 Public URL: {tunnel.public_url}")
        if subdomain:
            print(f"   (Requested subdomain: {subdomain})")
        print("\n✓ Tunnel is running. Press Ctrl+C to stop.")

        # Keep the script running to keep the tunnel alive
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\nStopping ngrok tunnel...")
            ngrok.disconnect(tunnel.public_url)
            ngrok.kill() # Kill all ngrok processes associated with this pyngrok instance
            print("✓ ngrok tunnel stopped.")
    except Exception as e:
        print(f"Error starting ngrok tunnel: {e}")
        print("\n**Troubleshooting ngrok:**")
        print("1. Ensure you have an ngrok account and a free authtoken from dashboard.ngrok.com/get-started/your-authtoken")
        print("2. Set the authtoken in your .env.tunnel file (NGR_AUTHTOKEN) or directly in the script.")
        print("3. Check your internet connection and ensure your local app is running on port", port)
        print("4. If using a custom subdomain, ensure it's not already taken or that your ngrok plan allows it.")
        sys.exit(1) # Exit if tunnel failed

if __name__ == "__main__":
    # --- Load environment variables from .env.tunnel ---
    # Specify the .env file path
    dotenv_path = os.path.join(os.path.dirname(__file__), '.env.tunnel')
    load_dotenv(dotenv_path=dotenv_path)

    # Get values from environment variables
    app_port = 8000 # Default port for your app
    
    # Get ngrok authtoken and subdomain from environment variables
    ngrok_auth_token = os.getenv("NGR_AUTHTOKEN")
    tunnel_subdomain = os.getenv("TUNNEL_SUBDOMAIN") # Use existing subdomain key

    # --- IMPORTANT ---
    # If you already have ngrok.exe downloaded (e.g., in C:\ngrok\ngrok.exe),
    # you can tell pyngrok where to find it:
    # from pyngrok import ngrok_path
    # ngrok_path.set("C:/ngrok/ngrok.exe") # Adjust path as needed
    # This prevents pyngrok from downloading a new copy.

    # Make sure your Python web app is running on this port BEFORE running this script
    start_ngrok_tunnel(port=app_port, authtoken=ngrok_auth_token, subdomain=tunnel_subdomain)