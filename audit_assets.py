import os
import re
from pathlib import Path

def audit_design_assets():
    base_dir = Path('design_inbox/front_assets/front_design')
    if not base_dir.exists():
        print("Error: Base directory not found")
        return

    print("--- [Design Assets Real Audit] ---")
    for folder in sorted(os.listdir(base_dir)):
        if folder.startswith('moban'):
            moban_id = folder.replace('moban', '')
            idx_path = base_dir / folder / 'index.html'
            
            actual_title = "Unknown Service"
            if idx_path.exists():
                try:
                    with open(idx_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
                        if match:
                            actual_title = match.group(1).strip()
                except:
                    pass
            
            print(f"ID:{moban_id} | TITLE:{actual_title}")

if __name__ == "__main__":
    audit_design_assets()
