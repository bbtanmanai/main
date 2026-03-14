import os
import json
from pathlib import Path

def check_nlm_profile():
    profile_path = Path.home() / ".nlm" / "profiles" / "default.json"
    if profile_path.exists():
        print(f"✅ Profile found: {profile_path}")
        try:
            with open(profile_path, 'r') as f:
                data = json.load(f)
                print(f"   Notebooks count in profile: {len(data.get('notebooks', {}))}")
                print(f"   CSRF Token present: {'csrf_token' in data}")
        except Exception as e:
            print(f"❌ Error reading profile: {e}")
    else:
        print(f"❌ Profile NOT found: {profile_path}")

if __name__ == "__main__":
    check_nlm_profile()
