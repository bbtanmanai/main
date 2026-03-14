#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
오팔 렌더링 트리거
==================
저장된 세션으로 오팔(opal.google) 앱에 인증 접속합니다.

사용법:
  python run_render.py                         # 기본 앱 URL 접속
  python run_render.py [project_id]            # 특정 프로젝트 접속
  python run_render.py --check                 # 접속만 테스트 (렌더 미트리거)
"""

import sys
import io
from pathlib import Path

# Windows CP949 환경에서 한글/특수문자 출력 보장
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).parent.parent))
from opal_auth import OpalAuthManager

OPAL_DEFAULT_APP = "https://opal.google/app/1YMGfiDKmKWTu5sBt5RCBZwFkxZtdYtfx"


def run_render(project_id: str | None = None, check_only: bool = False) -> bool:
    auth = OpalAuthManager()
    session = auth.load_session()

    # 세션 없음
    if not session:
        print("[ERROR] 저장된 세션이 없습니다.")
        print("        python login.py 로 먼저 로그인하세요.")
        return False

    url = f"https://opal.google/app/{project_id}" if project_id else OPAL_DEFAULT_APP

    print("=" * 60)
    print("[오팔] 접속 시도")
    print("=" * 60)
    print(f"  URL   : {url}")
    print(f"  쿠키  : {len(session.cookies)}개")
    if session.is_cookie_expired():
        print("  [경고] 세션이 7일 경과. 실패 시 python login.py 로 갱신하세요.")
    print()

    try:
        import httpx
    except ImportError:
        print("[ERROR] httpx가 없습니다. 'pip install httpx' 실행 후 재시도하세요.")
        return False

    try:
        print("  요청 전송 중...")
        r = httpx.get(
            url,
            headers=session.get_browser_headers(),
            follow_redirects=True,
            timeout=30,
        )
    except httpx.ConnectError:
        print("[ERROR] 네트워크 오류: opal.google 에 연결할 수 없습니다.")
        return False
    except httpx.TimeoutException:
        print("[ERROR] 요청 타임아웃 (30초). 네트워크 상태를 확인하세요.")
        return False
    except Exception as e:
        print(f"[ERROR] 요청 오류: {e}")
        return False

    # 응답 처리
    print(f"  HTTP 상태 : {r.status_code}")
    print(f"  최종 URL  : {r.url}")
    print()

    if r.status_code == 200:
        if check_only:
            print("[OK] 접속 테스트 성공 — 오팔 세션 정상.")
        else:
            print("[OK] 오팔 접속 성공.")
            print("     (렌더링 API는 오팔 내부 UI를 통해 트리거됩니다.)")
        return True

    if r.status_code in (401, 403):
        print("[ERROR] 인증 실패 — 세션이 만료되었습니다.")
        print("        python login.py 로 재로그인하세요.")
        return False

    if r.status_code == 302:
        location = r.headers.get("location", "")
        if "accounts.google.com" in location or "signin" in location:
            print("[ERROR] Google 로그인 페이지로 리디렉션됨 — 세션 만료.")
            print("        python login.py 로 재로그인하세요.")
            return False

    print(f"[WARNING] 예상치 못한 상태 코드: {r.status_code}")
    return False


if __name__ == "__main__":
    args = sys.argv[1:]
    check_only = "--check" in args
    project_id = next((a for a in args if not a.startswith("--")), None)

    result = run_render(project_id=project_id, check_only=check_only)
    sys.exit(0 if result else 1)
