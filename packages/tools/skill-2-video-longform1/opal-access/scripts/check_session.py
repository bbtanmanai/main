#!/usr/bin/env python3
"""
Opal Session Check
Usage:
  python check_session.py              # local status check
  python check_session.py --validate   # validate via Drive API
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from opal_auth import OpalAuthManager


def check_session(validate=False):
    auth = OpalAuthManager()
    info = auth.status()

    print("=" * 50)
    print("[Opal] Session Status")
    print("=" * 50)

    if info["status"] == "no_session":
        print("ERROR: No session found.")
        print()
        print("Run:  python login.py")
        return False

    print(f"Cookies     : {info['cookies']} ({info['cookie_age_hours']}h ago)")
    print(f"Bearer Token: {info['token']} ({info['token_age_minutes']}min ago)")
    print(f"File        : {info['session_file']}")
    print()

    if info["status"] == "cookies_old":
        print("WARNING: Cookies are older than 7 days. Re-login recommended.")

    if info["token"] == "expired":
        print("WARNING: Bearer Token expired. Will auto-refresh on next use.")

    if validate:
        print("Validating via Drive API...")
        if not auth.load_session().has_valid_token():
            print("  Token expired, refreshing via CDP...")
            token = auth.refresh_token_via_cdp()
            if not token:
                print("ERROR: Token refresh failed. Open Chrome with Opal and retry.")
                return False
            print("  Token refreshed.")

        if auth.validate_project_access():
            print("OK: Project access confirmed via Drive API.")
            return True
        else:
            print("ERROR: Cannot access Opal project. Re-login required.")
            print("  python login.py")
            return False
    else:
        print("OK: Local session check passed.")
        print("  (Full validation: python check_session.py --validate)")
        return True


if __name__ == "__main__":
    validate_flag = "--validate" in sys.argv
    result = check_session(validate=validate_flag)
    sys.exit(0 if result else 1)
