#!/usr/bin/env python3
"""
Opal Login Script
CDP auto-extract: cookies + Bearer Token.

Usage:
  python login.py               # CDP auto mode (launch Chrome)
  python login.py --manual      # manual cookie paste (no CDP)
  python login.py --extract-only  # extract from already-open Chrome
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from opal_auth import OpalAuthManager, parse_cookie_string, validate_google_cookies, CDP_PORT

OPAL_TARGET_URL = "https://opal.google/edit/1YQTJjGO0VnQN5U38CE6hHNIhbcindUXt"
CDP_WAIT_SEC = 4


def find_chrome():
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    ]
    return next((p for p in candidates if os.path.exists(p)), None)


def launch_chrome(chrome_exe, url):
    user_data_dir = Path.home() / ".linkdrop-opal" / "chrome-profile"
    user_data_dir.mkdir(parents=True, exist_ok=True)
    cmd = [
        chrome_exe,
        f"--remote-debugging-port={CDP_PORT}",
        "--remote-allow-origins=*",
        f"--user-data-dir={user_data_dir}",
        "--no-first-run",
        "--no-default-browser-check",
        url,
    ]
    return subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def extract_all_via_cdp(port=CDP_PORT, reload=True):
    """CDP로 쿠키 + Bearer Token 동시 추출."""
    try:
        import httpx
        import websocket
    except ImportError as e:
        print(f"ERROR: Missing dependency: {e}")
        return None, None

    # 탭 조회
    try:
        tabs = httpx.get(f"http://localhost:{port}/json", timeout=5).json()
        tab = next(
            (t for t in tabs if "opal.google" in t.get("url", "") and t.get("type") == "page"),
            next((t for t in tabs if t.get("type") == "page"), None),
        )
        if not tab:
            print(f"ERROR: No Chrome page tab found on port {port}")
            return None, None
        print(f"  Tab: {tab.get('url', '')[:70]}")
    except Exception as e:
        print(f"ERROR: CDP connect failed (port {port}): {e}")
        return None, None

    ws_url = tab["webSocketDebuggerUrl"]
    try:
        ws = websocket.create_connection(ws_url, timeout=20)
    except Exception as e:
        print(f"ERROR: WebSocket connect failed: {e}")
        return None, None

    try:
        # Network 모니터링 + 쿠키 추출
        ws.send(json.dumps({"id": 1, "method": "Network.enable"}))
        ws.recv()

        ws.send(json.dumps({"id": 2, "method": "Network.getAllCookies"}))
        result = json.loads(ws.recv())
        cookies_list = result.get("result", {}).get("cookies", [])
        google_cookies = {
            c["name"]: c["value"]
            for c in cookies_list
            if "google" in c.get("domain", "").lower()
        }
        print(f"  Cookies: {len(google_cookies)} Google cookies extracted")

        # 페이지 리로드 → Drive API 호출 유발 → Bearer Token 캡처
        if reload:
            print("  Reloading page to capture Bearer Token...")
            ws.send(json.dumps({"id": 3, "method": "Page.reload"}))
            ws.recv()

        bearer_token = None
        ws.settimeout(15)
        while True:
            msg = json.loads(ws.recv())
            if msg.get("method") == "Network.requestWillBeSent":
                req = msg.get("params", {}).get("request", {})
                url = req.get("url", "")
                headers = req.get("headers", {})
                auth = headers.get("Authorization", headers.get("authorization", ""))
                if "googleapis.com" in url and auth.startswith("Bearer"):
                    bearer_token = auth
                    print(f"  Bearer Token: captured ({len(auth)} chars)")
                    break

    except websocket.WebSocketTimeoutException:
        print("  WARNING: Bearer Token capture timed out (page may not have made Drive API calls)")
        bearer_token = None
    except Exception as e:
        print(f"ERROR: {e}")
        bearer_token = None
    finally:
        ws.close()

    return google_cookies if google_cookies else None, bearer_token


def manual_login():
    print("=" * 60)
    print("[Opal Login] Manual mode")
    print("=" * 60)
    print()
    print("Steps:")
    print("  1. Open https://opal.google and log in")
    print("  2. F12 -> Network tab")
    print("  3. Click any request -> Headers -> copy 'cookie:' value")
    print()

    try:
        cookie_str = input("Paste cookie string -> ").strip()
    except (KeyboardInterrupt, EOFError):
        print("\nCancelled.")
        sys.exit(0)

    if not cookie_str:
        print("ERROR: No input.")
        sys.exit(1)

    cookies = parse_cookie_string(cookie_str)
    if not cookies:
        print("ERROR: Failed to parse cookies.")
        sys.exit(1)

    _save_and_report(cookies, bearer_token=None)


def auto_login():
    chrome_exe = find_chrome()
    if not chrome_exe:
        print("ERROR: Chrome not found. Use --manual mode.")
        sys.exit(1)

    print("=" * 60)
    print("[Opal Login] CDP auto mode")
    print("=" * 60)
    print(f"Chrome: {chrome_exe}")
    print(f"Target: {OPAL_TARGET_URL}")
    print()

    print("Launching Chrome in CDP mode...")
    proc = launch_chrome(chrome_exe, OPAL_TARGET_URL)

    print(f"Waiting {CDP_WAIT_SEC}s for Chrome to start...")
    time.sleep(CDP_WAIT_SEC)

    print()
    print("Log in with your Google account in the Chrome window.")
    input("Press Enter when Opal editor is open: ")
    print()

    print("Extracting cookies + Bearer Token...")
    cookies, bearer = extract_all_via_cdp()

    if not cookies:
        print("Auto extraction failed. Try: python login.py --manual")
        proc.terminate()
        sys.exit(1)

    _save_and_report(cookies, bearer)


def extract_only():
    """Chrome이 이미 열려있을 때 추출 (bat 연동용)."""
    print("Extracting cookies + Bearer Token (Chrome must be open)...")
    cookies, bearer = extract_all_via_cdp()
    if not cookies:
        sys.exit(1)
    _save_and_report(cookies, bearer)


def _save_and_report(cookies, bearer_token):
    auth = OpalAuthManager()
    auth.save_session(cookies, bearer_token=bearer_token or "")

    has_required = validate_google_cookies(cookies)
    print()
    print("=" * 60)
    print(f"Cookies    : {len(cookies)} saved {'(OK)' if has_required else '(some missing)'}")
    print(f"Bearer Token: {'captured' if bearer_token else 'NOT captured (token refresh needed)'}")
    print(f"Saved to   : {auth.session_file}")
    print("=" * 60)
    if not bearer_token:
        print()
        print("NOTE: Bearer Token not captured.")
        print("      It will be auto-refreshed when needed (Chrome must be open).")


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--help" in args or "-h" in args:
        print(__doc__)
        sys.exit(0)
    elif "--manual" in args:
        manual_login()
    elif "--extract-only" in args:
        extract_only()
    else:
        auto_login()
