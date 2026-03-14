import os
import shutil
import subprocess
import sys

TEMP_DIR = "apps/api/temp"
# Example process name, should be adjusted based on actual Opal binary
PROCESS_NAME = "opal_engine.exe" 

def recover():
    print("Initiating Opal Recovery Sequence...")
    
    # 1. Kill Zombie Processes
    try:
        if os.name == 'nt': # Windows
            subprocess.run(["taskkill", "/F", "/IM", PROCESS_NAME], capture_output=True)
        else:
            subprocess.run(["pkill", "-9", PROCESS_NAME], capture_output=True)
        print("Step 1: Zombie processes terminated.")
    except Exception as e:
        print(f"Step 1: Error during process termination: {e}")

    # 2. Cleanup Temp Files
    if os.path.exists(TEMP_DIR):
        try:
            shutil.rmtree(TEMP_DIR)
            os.makedirs(TEMP_DIR)
            print(f"Step 2: Temporary directory {TEMP_DIR} cleared.")
        except Exception as e:
            print(f"Step 2: Error cleaning temp dir: {e}")
    else:
        os.makedirs(TEMP_DIR)
        print("Step 2: Temp directory created.")

    # 3. Final Report
    print("Recovery Sequence Complete. Opal is ready for restart.")
    return True

if __name__ == "__main__":
    recover()
