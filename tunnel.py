import subprocess
import sys
import time

def start_localtunnel():
    try:
        print("Starting LocalTunnel...")
        
        # Start localtunnel using subprocess with correct syntax
        process = subprocess.Popen(
            ["pylt", "port", "8000"],  # Correct syntax: "port" before the port number
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Give it a moment to start
        time.sleep(3)
        
        if process.poll() is None:
            print("✓ LocalTunnel started successfully")
            
            # Read the output to get the URL and any password
            try:
                # Read all available output
                stdout, stderr = process.communicate(timeout=5)
                
                # Look for the tunnel URL and password
                tunnel_url = None
                password = None
                
                for line in stdout.split('\n'):
                    line = line.strip()
                    if 'https://' in line and ('loca.lt' in line or 'pinggy.link' in line):
                        tunnel_url = line
                    elif 'password:' in line.lower() or 'token:' in line.lower():
                        password = line
                
                print("\n" + "="*60)
                print("🌐 TUNNEL INFORMATION:")
                print("="*60)
                print("🌐 URL: " + (tunnel_url if tunnel_url else "Not found in output"))
                
                if password:
                    print("🔐 Password: " + password)
                    print("\n⚠  IMPORTANT: Share both the URL AND password!")
                else:
                    print("🔐 Password: None (no authentication required)")
                    print("\n✅ Just share the URL above")
                
                print("="*60)
                print("\n✓ Tunnel is running. Press Ctrl+C to stop the tunnel")
                
                # Keep the tunnel running and wait for user to stop it
                try:
                    while process.poll() is None:
                        time.sleep(1)
                except KeyboardInterrupt:
                    print("\n\nStopping tunnel...")
                    process.terminate()
                    process.wait(timeout=5)
                    print("✓ Tunnel stopped successfully")
                    
            except subprocess.TimeoutExpired:
                print("✓ Tunnel is running in background")
                print("✓ Try running 'pylt port 8000' directly in another terminal to see full output")
                print("✓ Press Ctrl+C to stop this script")
                
                # Wait for user interruption
                try:
                    while process.poll() is None:
                        time.sleep(1)
                except KeyboardInterrupt:
                    print("\nStopping tunnel...")
                    process.terminate()
                    process.wait(timeout=5)
                    print("✓ Tunnel stopped successfully")
        else:
            stdout, stderr = process.communicate()
            print("Error starting tunnel:")
            if stdout:
                print("STDOUT:", stdout)
            if stderr:
                print("STDERR:", stderr)
            
    except FileNotFoundError:
        print("Error: pylt command not found.")
        print("Please install py-localtunnel using: pip install py-localtunnel")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = start_localtunnel()
    if not success:
        print("Failed to start tunnel")
        sys.exit(1)