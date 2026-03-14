import os
import re
import sys

OPAL_SERVICE_PATH = "apps/api/services/opal_service.py"

STANDARDS = {
    "font": "Gmarket Sans",
    "bgm_volume": "0.0",
    "motion_effect": "Ken-Burns-Zoom"
}

def check_standards():
    if not os.path.exists(OPAL_SERVICE_PATH):
        print(f"Error: {OPAL_SERVICE_PATH} not found.")
        return False

    with open(OPAL_SERVICE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    issues = []
    
    # Simple regex checks for demonstration
    if STANDARDS["font"] not in content:
        issues.append(f"Font mismatch: Expected {STANDARDS['font']}")
    
    if 'bgm_volume": 0.0' not in content and 'bgm_volume = 0.0' not in content:
        issues.append("BGM volume mismatch: Expected 0.0")

    if issues:
        print("Status: Issues Found")
        for issue in issues:
            print(f"- {issue}")
        return False
    
    print("Status: All nodes aligned with standards.")
    return True

if __name__ == "__main__":
    if check_standards():
        sys.exit(0)
    else:
        sys.exit(1)
