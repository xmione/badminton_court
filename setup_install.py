# setup_install.py
# Description: Automates setup of your Python environment:
# - ✅ Upgrades pip
# - ✅ Purges pip cache (optional)
# - ✅ Installs requirements.txt
# - ✅ Sets up Django project

import subprocess
import sys
import os
import shutil
from pathlib import Path

FORCE_PURGE = "--force" in sys.argv

def get_vcvars_env(vcvars_bat: str) -> dict:
    print(f"🔍 Capturing environment from: {vcvars_bat}")
    try:
        command = f'call "{vcvars_bat}" && set'
        print(f"[DEBUG] Command: {command}")
        process = subprocess.Popen(
            f'cmd.exe /s /c "{command}"',
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True,
            universal_newlines=True
        )
        stdout, stderr = process.communicate()
        if process.returncode != 0:
            print("❌ Failed to run vcvars64.bat.")
            print(stderr)
            return None
        env = os.environ.copy()
        for line in stdout.splitlines():
            if '=' in line:
                key, value = line.strip().split('=', 1)
                env[key] = value
        # ✅ Properly check for cl.exe using the updated PATH
        if not shutil.which("cl", path=env.get("PATH", "")):
            print("⚠️ MSVC environment applied, but cl.exe was NOT found in PATH.")
        else:
            print("✅ MSVC environment captured, cl.exe is available.")
        return env
    except Exception as e:
        print("❌ Exception while capturing MSVC env:", e)
        return None

def find_vcvars_bat():
    # First, search PATH
    for p in os.environ.get("PATH", "").split(os.pathsep):
        candidate = os.path.join(p, "vcvars64.bat")
        if os.path.exists(candidate):
            print(f"✅ Found vcvars64.bat in PATH: {candidate}")
            return candidate

    # Fallback: common installation paths
    fallback_paths = [
        r"C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat",
        r"C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat",
        r"C:\Program Files\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvars64.bat",
        r"C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvars64.bat"
    ]
    for path in fallback_paths:
        if os.path.exists(path):
            print(f"✅ Found vcvars64.bat at fallback: {path}")
            return path

    print("❌ Could not find vcvars64.bat. MSVC might not be installed.")
    return None

def update_pip():
    print("Updating pip...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], check=True)
        print("✅ pip upgraded.")
    except subprocess.CalledProcessError as e:
        print("❌ pip upgrade failed:", e)
        sys.exit(1)

def purge_pip_cache():
    print("Purging pip cache...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "cache", "purge"], check=True)
        print("🧹 pip cache purged.")
    except subprocess.CalledProcessError:
        print("⚠️ Could not purge pip cache.")

def install_requirements():
    print("📦 Installing requirements...")
    try:
        # Install all requirements in one step
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            check=True
        )
        print("✅ Requirements installed.")
    except subprocess.CalledProcessError as e:
        print("❌ Requirements install failed:", e)
        sys.exit(1)

def setup_django():
    print("🚀 Setting up Django project...")
    try:
        # Run migrations
        subprocess.run([sys.executable, "manage.py", "migrate"], check=True)
        print("✅ Database migrations applied.")
        
        # Create a superuser if it doesn't exist
        # We'll just provide instructions since creating a superuser requires interactive input
        print("ℹ️ To create a superuser, run:")
        print("   python manage.py createsuperuser")
        
        # Collect static files
        subprocess.run([sys.executable, "manage.py", "collectstatic", "--noinput"], check=True)
        print("✅ Static files collected.")
    except subprocess.CalledProcessError as e:
        print("❌ Django setup failed:", e)
        print("⚠️ If you want to use PostgreSQL for local development, make sure it's running on localhost:5432.")
        print("⚠️ Or update your settings.py to use SQLite for local development.")
        # Continue with the setup process even if Django setup fails
        print("⚠️ Continuing with setup process...")

def check_docker():
    print("🐳 Checking if Docker is installed...")
    try:
        result = subprocess.run(["docker", "--version"], capture_output=True, text=True, check=True)
        print("✅ Docker is installed:", result.stdout.strip())
        
        # Check if Docker Compose is available
        result = subprocess.run(["docker-compose", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Docker Compose is installed:", result.stdout.strip())
            return True
        else:
            print("❌ Docker Compose is not installed or not in PATH")
            return False
    except Exception:
        print("❌ Docker is not installed or not in PATH")
        print("💡 Install Docker Desktop from https://www.docker.com/products/docker-desktop")
        return False

def setup_docker():
    print("🐳 Setting up Docker environment...")
    try:
        # Build Docker images
        subprocess.run(["docker-compose", "build"], check=True)
        print("✅ Docker images built successfully.")
        
        print("ℹ️ To start the application with Docker, run:")
        print("   docker-compose up")
        
        print("ℹ️ To run database migrations with Docker, run:")
        print("   docker-compose run web python manage.py migrate")
        
        print("ℹ️ To create a superuser with Docker, run:")
        print("   docker-compose run web python manage.py createsuperuser")
        
    except subprocess.CalledProcessError as e:
        print("❌ Docker setup failed:", e)
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Starting Python environment setup for Badminton Court Management...")
    update_pip()
    if FORCE_PURGE:
        purge_pip_cache()
    else:
        print("🛑 Skipping pip cache purge (use --force to enable)")
    install_requirements()
    setup_django()
    
    # Check if Docker is available and set it up
    if check_docker():
        setup_docker()
    
    print("\n🎉 Setup complete! You're ready to go.")
    print("\n📋 Next steps:")
    print("   1. Activate the virtual environment: .\\venv\\Scripts\\Activate.ps1")
    print("   2. Create a superuser: python manage.py createsuperuser")
    print("   3. Start the development server: python manage.py runserver")
    print("   4. Or use Docker: docker-compose up")