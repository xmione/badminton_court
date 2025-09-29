import subprocess
import sys
import time

def start_localtunnel(subdomain=None):
    try:
        print("Starting LocalTunnel...")
        
        # Build the command
        cmd = ["pylt", "port", "8000"]
        if subdomain:
            cmd.extend(["-s", subdomain])
            print(f"Using custom subdomain: {subdomain}")
        
        # Start localtunnel using subprocess
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Give it a moment to start
        time.sleep(2)
        
        if process.poll() is None:
            print("✓ LocalTunnel started successfully")
            
            # Read the output line by line in real-time
            tunnel_url = None
            password = None
            output_captured = False
            
            print("\n" + "="*60)
            print("🌐 LOOKING FOR TUNNEL INFORMATION...")
            print("="*60)
            
            # Read output for up to 10 seconds to find the tunnel info
            start_time = time.time()
            while (time.time() - start_time) < 10 and process.poll() is None:
                line = process.stdout.readline()
                if not line:
                    time.sleep(0.1)
                    continue
                
                line = line.strip()
                print(f"📝 Output: {line}")
                
                # Look for the tunnel URL
                if 'https://' in line and ('loca.lt' in line or 'pinggy.link' in line):
                    tunnel_url = line
                    output_captured = True
                
                # Look for password/token
                elif 'password:' in line.lower() or 'token:' in line.lower():
                    password = line
                    output_captured = True
            
            # Display the tunnel information
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
            
            if output_captured:
                print("\n✓ Tunnel information captured successfully!")
            else:
                print("\n⚠  Could not capture tunnel information from output")
                print("✓ The tunnel is still running in the background")
            
            print("\n✓ Tunnel is running. Press Ctrl+C to stop the tunnel")
            
            # Keep the tunnel running and wait for user to stop it
            try:
                while process.poll() is None:
                    line = process.stdout.readline()
                    if line:
                        print(f"📝 {line.strip()}")
                    else:
                        time.sleep(0.1)
            except KeyboardInterrupt:
                print("\n\nStopping tunnel...")
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
    # You can specify a custom subdomain here, or pass None for random
    custom_subdomain = "aeropace-portal"  # Change this to your desired subdomain
    success = start_localtunnel(subdomain=custom_subdomain)
    if not success:
        print("Failed to start tunnel")
        sys.exit(1)