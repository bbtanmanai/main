#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OAuth2 Refresh Token 최초 셋업
================================
한 번만 실행하면 이후 Chrome 없이 Bearer Token 자동 갱신됩니다.

사전 준비:
  1. Google Cloud Console → API 및 서비스 → 사용자 인증 정보
  2. "OAuth 2.0 클라이언트 ID" 생성 → 애플리케이션 유형: 데스크톱 앱
  3. client_id, client_secret 복사
  4. .env에 추가:
       GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
       GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

사용법:
  python setup_refresh_token.py
"""

import sys
import os
import json
from pathlib import Path

# .env 로드
_ROOT_ENV = Path(__file__).parent.parent.parent.parent.parent.parent / ".env"
if _ROOT_ENV.exists():
    for _line in _ROOT_ENV.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

sys.path.insert(0, str(Path(__file__).parent.parent))
from opal_auth import OpalAuthManager, OAUTH_SCOPES

CLIENT_ID     = os.environ.get("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")


def main() -> int:
    if not CLIENT_ID or not CLIENT_SECRET:
        print("=" * 60)
        print("[ERROR] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 누락")
        print()
        print("설정 방법:")
        print("  1. Google Cloud Console 접속")
        print("     https://console.cloud.google.com/apis/credentials")
        print()
        print("  2. '사용자 인증 정보 만들기' → 'OAuth 2.0 클라이언트 ID'")
        print("     애플리케이션 유형: 데스크톱 앱")
        print("     이름: LinkDrop (아무 이름)")
        print()
        print("  3. 생성 후 client_id, client_secret 복사")
        print()
        print("  4. C:\\LinkDropV2\\.env 에 추가:")
        print("     GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com")
        print("     GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx")
        print()
        print("  5. 이 스크립트 다시 실행")
        print("=" * 60)
        return 1

    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        print("[ERROR] google-auth-oauthlib 미설치")
        print("  pip install google-auth-oauthlib")
        return 1

    print("=" * 60)
    print("Google OAuth2 인증을 시작합니다.")
    print("브라우저가 열리면 Opal 소유자 Google 계정으로 로그인하세요.")
    print("=" * 60)

    client_config = {
        "installed": {
            "client_id":     CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
            "token_uri":     "https://oauth2.googleapis.com/token",
            "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"],
        }
    }

    flow = InstalledAppFlow.from_client_config(client_config, OAUTH_SCOPES)
    creds = flow.run_local_server(port=0, open_browser=True)

    if not creds.refresh_token:
        print("[ERROR] Refresh Token을 받지 못했습니다.")
        print("  Google Cloud Console에서 테스트 사용자에 계정을 추가했는지 확인하세요.")
        return 1

    # session.json에 저장
    auth = OpalAuthManager()
    session = auth.load_session()
    if not session:
        print("[ERROR] 기존 세션이 없습니다. python login.py 먼저 실행하세요.")
        return 1

    session.refresh_token  = creds.refresh_token
    session.client_id      = CLIENT_ID
    session.client_secret  = CLIENT_SECRET
    session.bearer_token   = f"Bearer {creds.token}"
    import time as _time
    session.token_captured_at = _time.time()

    auth.session_file.write_text(
        json.dumps(session.to_dict(), indent=2, ensure_ascii=False)
    )

    print()
    print("[OK] Refresh Token 저장 완료!")
    print(f"     위치: {auth.session_file}")
    print()
    print("이제 Chrome 없이도 Bearer Token이 자동 갱신됩니다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
