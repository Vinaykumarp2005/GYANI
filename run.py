#!/usr/bin/env python3
"""
GYANI - Universal Single-Command Runner
Automates virtual environment detection/setup, dependencies, sample data generation,
and launches both FastAPI backend and Vite React frontend concurrently.
"""

import os
import sys
import shutil
import subprocess
import signal
import time

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
VENV_DIR = os.path.join(BACKEND_DIR, ".venv")

def get_venv_python():
    if sys.platform == "win32":
        return os.path.join(VENV_DIR, "Scripts", "python.exe")
    return os.path.join(VENV_DIR, "bin", "python")

def ensure_venv():
    venv_python = get_venv_python()
    if not os.path.exists(venv_python):
        print("[GYANI] Python virtual environment not found. Creating backend/.venv...")
        subprocess.check_call([sys.executable, "-m", "venv", VENV_DIR])
        print("[GYANI] Virtual environment created successfully.")
        
        req_file = os.path.join(BACKEND_DIR, "requirements.txt")
        if os.path.exists(req_file):
            print("[GYANI] Installing backend requirements...")
            subprocess.check_call([venv_python, "-m", "pip", "install", "--upgrade", "pip"])
            subprocess.check_call([venv_python, "-m", "pip", "install", "-r", req_file])
            print("[GYANI] Backend requirements installed successfully.")
    return venv_python

def ensure_sample_data(venv_python):
    data_dir = os.path.join(BACKEND_DIR, "data")
    sample_nc = os.path.join(data_dir, "sample_ocean.nc")
    gen_script = os.path.join(data_dir, "generate_sample_data.py")
    if not os.path.exists(sample_nc) and os.path.exists(gen_script):
        print("[GYANI] Sample ocean NetCDF dataset missing. Generating...")
        subprocess.check_call([venv_python, gen_script], cwd=BACKEND_DIR)
        print("[GYANI] Sample ocean dataset generated.")

def ensure_frontend():
    node_modules = os.path.join(FRONTEND_DIR, "node_modules")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    if not os.path.exists(node_modules):
        print("[GYANI] Frontend node_modules not found. Running npm install...")
        subprocess.check_call([npm_cmd, "install"], cwd=FRONTEND_DIR)
        print("[GYANI] Frontend dependencies installed.")

def terminate_process(proc):
    if proc and proc.poll() is None:
        try:
            if sys.platform == "win32":
                subprocess.call(["taskkill", "/F", "/T", "/PID", str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                proc.terminate()
        except Exception:
            pass

def main():
    print("=" * 64)
    print("  GYANI: Intelligent Oceanographic Visualizer - Unified Runner")
    print("=" * 64)

    # 1. Ensure backend virtual environment & dependencies
    venv_python = ensure_venv()

    # 2. Ensure sample NetCDF scientific data exists
    ensure_sample_data(venv_python)

    # 3. Ensure frontend dependencies exist
    ensure_frontend()

    print("\n[GYANI] Starting Backend API (FastAPI) and Frontend UI (Vite)...")
    print(" -> Backend API:  http://localhost:8000")
    print(" -> Swagger Docs: http://localhost:8000/docs")
    print(" -> Frontend UI:  http://localhost:5173\n")
    print("Press Ctrl+C to stop all services.\n" + "-" * 64 + "\n")

    backend_cmd = [venv_python, "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"]
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]

    backend_proc = None
    frontend_proc = None

    try:
        backend_proc = subprocess.Popen(backend_cmd, cwd=BACKEND_DIR)
        frontend_proc = subprocess.Popen(frontend_cmd, cwd=FRONTEND_DIR)

        while True:
            # Check if any process terminated prematurely
            b_code = backend_proc.poll()
            f_code = frontend_proc.poll()
            if b_code is not None:
                print(f"\n[GYANI] Backend API exited with code {b_code}")
                break
            if f_code is not None:
                print(f"\n[GYANI] Frontend UI exited with code {f_code}")
                break
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\n[GYANI] Stopping all services...")
    finally:
        terminate_process(backend_proc)
        terminate_process(frontend_proc)
        print("[GYANI] All services stopped cleanly. Goodbye!\n")

if __name__ == "__main__":
    main()
