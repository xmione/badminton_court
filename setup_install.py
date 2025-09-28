# setup_install.py
# Description: Automates setup of your Python environment:
# - ✅ Verifies Rust
# - ✅ Upgrades pip
# - ✅ Purges pip cache (optional)
# - ✅ Installs requirements + llama-cpp-python with MSVC env
# - ✅ Ensures HuggingFace CLI and login
# - ✅ Downloads model from HuggingFace

import subprocess
import sys
import os
import shutil
from pathlib import Path

FORCE_PURGE = "--force" in sys.argv
MODEL = "gpt2"

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

def check_rust():
    print("Checking if rustc is installed...")
    try:
        result = subprocess.run(["rustc", "--version"], capture_output=True, text=True, check=True)
        print("✅ Rust is installed:", result.stdout.strip())
    except Exception:
        print("❌ Rust is not installed or not available on PATH.")
        print("👉 Please install Rust from https://rustup.rs and restart.")
        sys.exit(1)

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

def cmake_path(path):
    # Convert Windows path to CMake-friendly forward slashes
    return path.replace("\\", "/")

def install_requirements():
    print("📦 Installing requirements...")
    vcvars_bat = find_vcvars_bat()
    msvc_env = get_vcvars_env(vcvars_bat) if vcvars_bat else None

    if msvc_env:
        cl_path = shutil.which("cl.exe", path=msvc_env.get("PATH", ""))
        if cl_path:
            print(f"🛠️  Detected cl.exe at: {cl_path}")
            escaped_path = cmake_path(cl_path)
            msvc_env["CMAKE_ARGS"] = f'-DCMAKE_C_COMPILER="{escaped_path}" -DCMAKE_CXX_COMPILER="{escaped_path}"'
 
            print(f"✅ Injected CMAKE_ARGS with escaped path.")
        else:
            print("⚠️ cl.exe not found even after activating vcvars64.bat.")
    else:
        print("⚠️  Could not apply MSVC environment — falling back.")

    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            check=True, env=msvc_env or os.environ
        )
        print("✅ Requirements installed.")
    except subprocess.CalledProcessError as e:
        print("❌ Requirements install failed:", e)
        sys.exit(1)

    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "llama-cpp-python", "--prefer-binary"],
            check=True, env=msvc_env or os.environ
        )
        print("✅ llama-cpp-python installed.")
    except subprocess.CalledProcessError as e:
        print("❌ llama-cpp-python install failed:", e)
        sys.exit(1)

def ensure_huggingface_cli():
    print("Checking for Hugging Face CLI...")
    if shutil.which("huggingface-cli"):
        print("✅ huggingface-cli is already available.")
        return
    print("📦 Installing huggingface_hub...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "huggingface_hub"], check=True)
        print("✅ huggingface_hub installed.")
    except subprocess.CalledProcessError as e:
        print("❌ Failed to install huggingface_hub:", e)
        sys.exit(1)

def is_huggingface_logged_in():
    token_file = Path.home() / ".cache" / "huggingface" / "token"
    return token_file.exists() and token_file.stat().st_size > 0

def authenticate_huggingface():
    print("🔐 Checking Hugging Face login...")
    if is_huggingface_logged_in():
        print("✅ Already logged in.")
        return
    print("🔐 Not logged in. Launching login prompt...")
    try:
        subprocess.run(["huggingface-cli", "login"], check=True)
        print("✅ Logged in successfully.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Login failed: {e}")
        print("💡 Run `huggingface-cli login` manually.")

def install_cmake_with_winget():
    print("🔍 Checking if CMake is installed...")
    if shutil.which("cmake"):
        print("✅ CMake is already installed.")
        return
    print("📦 Installing CMake via winget...")
    try:
        subprocess.run([
            "winget", "install", "--id", "Kitware.CMake",
            "--silent", "--accept-package-agreements", "--accept-source-agreements"
        ], check=True)
        print("✅ CMake installed via winget.")
    except Exception as e:
        print("❌ Failed to install CMake:", e)
        print("👉 Manually install from https://cmake.org/download/")
        sys.exit(1)

def download_model(model_name):
    print(f"📥 Downloading model: {model_name}")
    try:
        subprocess.run(["huggingface-cli", "download", model_name], check=True)
        print(f"✅ Model '{model_name}' downloaded.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to download model '{model_name}':", e)
        print("💡 Try downloading it manually from Hugging Face.")

if __name__ == "__main__":
    print("🚀 Starting Python environment setup...")
    check_rust()
    install_cmake_with_winget()
    update_pip()
    if FORCE_PURGE:
        purge_pip_cache()
    else:
        print("🛑 Skipping pip cache purge (use --force to enable)")
    install_requirements()
    ensure_huggingface_cli()
    authenticate_huggingface()
    download_model(MODEL)
    print("\n🎉 Setup complete! You're ready to go.")
