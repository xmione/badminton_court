from pyngrok import ngrok
import time
import sys

def start_ngrok_tunnel(port=8000, authtoken=None):
    print("Starting ngrok tunnel...")
    try:
        # Set authtoken from argument or environment variable
        if authtoken:
            ngrok.set_auth_token(authtoken)
        else:
            # Attempt to read from default config file (e.g., ~/.ngrok2/ngrok.yml)
            # or an environment variable NGROK_AUTHTOKEN
            print("No authtoken provided. Will attempt to use pre-configured token or environment variable.")

        # Connect to the specified port
        # pyngrok will download ngrok.exe if it's not found in expected locations
        tunnel = ngrok.connect(port)
        print(f"✓ ngrok tunnel established!")
        print(f"🌐 Public URL: {tunnel.public_url}")
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
        print("2. Set the authtoken in your script (replace 'YOUR_NGR_AUTHTOKEN') or configure it via `ngrok.set_auth_token()` or via environment variable.")
        print("3. Check your internet connection and ensure your local app is running on port", port)
        sys.exit(1) # Exit if tunnel failed

if __name__ == "__main__":
    # Make sure your Python web app is running on this port BEFORE running this script
    app_port = 8000 
    
    # Replace 'YOUR_NGR_AUTHTOKEN_HERE' with the free token you got from ngrok.com
    # It's safer to load this from an environment variable or a config file in production
    # For quick testing, you can paste it directly here.
    ngrok_auth_token = "YOUR_NGR_AUTHTOKEN_HERE" 
    
    # --- IMPORTANT ---
    # If you already have ngrok.exe downloaded (e.g., in C:\ngrok\ngrok.exe),
    # you can tell pyngrok where to find it:
    # from pyngrok import ngrok_path
    # ngrok_path.set("C:/ngrok/ngrok.exe")
    # This prevents pyngrok from downloading a new copy.
    
    start_ngrok_tunnel(port=app_port, authtoken=ngrok_auth_token)
