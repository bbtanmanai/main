"""
오팔(Opal) 독립 인증 모듈 v3
==============================
- 인증 방식 (우선순위):
    1. OAuth2 Refresh Token → 자동 갱신 (Chrome 불필요)
    2. CDP 페이지 리로드 → Bearer Token 캡처 (폴백)
- 저장 위치: ~/.linkdrop-opal/profiles/default/session.json
- 최초 1회 setup: python setup_refresh_token.py

의존성: httpx, websocket-client, google-auth-oauthlib, google-auth
"""

import json
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

OPAL_BASE_URL   = "https://opal.google"
OPAL_EDIT_URL   = "https://opal.google/edit/1YQTJjGO0VnQN5U38CE6hHNIhbcindUXt"
DRIVE_API_BASE  = "https://www.googleapis.com/drive/v3"
STORAGE_DIR     = Path.home() / ".linkdrop-opal"
DEFAULT_PROFILE = "default"
CDP_PORT        = 9222

# Bearer token 유효 시간 (Google OAuth2 access token = 1시간)
TOKEN_TTL_SEC = 3500

# OAuth2 스코프 (Drive + AppCatalyst 포함)
OAUTH_SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/cloud-platform",
]


@dataclass
class OpalSession:
    """오팔 인증 세션 데이터."""
    cookies: dict
    bearer_token: str = ""
    token_captured_at: float = 0.0
    extracted_at: float = field(default_factory=time.time)
    # OAuth2 Refresh Token (한 번 발급 후 영구 사용)
    refresh_token: str = ""
    client_id: str = ""
    client_secret: str = ""

    # ── 쿠키 ──
    @property
    def cookie_header(self) -> str:
        return "; ".join(f"{k}={v}" for k, v in self.cookies.items())

    def is_cookie_expired(self, max_age_hours: float = 168) -> bool:
        return (time.time() - self.extracted_at) > (max_age_hours * 3600)

    # ── Bearer Token ──
    def has_valid_token(self) -> bool:
        if not self.bearer_token:
            return False
        return (time.time() - self.token_captured_at) < TOKEN_TTL_SEC

    def token_age_minutes(self) -> float:
        return (time.time() - self.token_captured_at) / 60

    # ── HTTP 헤더 ──
    def get_drive_headers(self) -> dict:
        """Google Drive API 요청 헤더."""
        return {
            "Authorization": self.bearer_token,
            "Content-Type": "application/json",
        }

    def get_browser_headers(self) -> dict:
        """쿠키 기반 브라우저 요청 헤더."""
        return {
            "Cookie": self.cookie_header,
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/145.0.0.0 Safari/537.36"
            ),
            "Origin": OPAL_BASE_URL,
            "Referer": OPAL_BASE_URL + "/",
        }

    # ── 직렬화 ──
    def to_dict(self) -> dict:
        return {
            "cookies": self.cookies,
            "bearer_token": self.bearer_token,
            "token_captured_at": self.token_captured_at,
            "extracted_at": self.extracted_at,
            "refresh_token": self.refresh_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "OpalSession":
        return cls(
            cookies=data.get("cookies", {}),
            bearer_token=data.get("bearer_token", ""),
            token_captured_at=data.get("token_captured_at", 0.0),
            extracted_at=data.get("extracted_at", 0.0),
            refresh_token=data.get("refresh_token", ""),
            client_id=data.get("client_id", ""),
            client_secret=data.get("client_secret", ""),
        )


class OpalAuthManager:
    """오팔 세션 저장/로드/갱신 관리자."""

    def __init__(self, profile: str = DEFAULT_PROFILE):
        self.profile = profile

    @property
    def profile_dir(self) -> Path:
        return STORAGE_DIR / "profiles" / self.profile

    @property
    def session_file(self) -> Path:
        return self.profile_dir / "session.json"

    # ────────────────────────────────────────
    # 저장 / 로드
    # ────────────────────────────────────────

    def save_session(self, cookies: dict, bearer_token: str = "") -> OpalSession:
        self.profile_dir.mkdir(parents=True, exist_ok=True)
        session = OpalSession(
            cookies=cookies,
            bearer_token=bearer_token,
            token_captured_at=time.time() if bearer_token else 0.0,
            extracted_at=time.time(),
        )
        self.session_file.write_text(
            json.dumps(session.to_dict(), indent=2, ensure_ascii=False)
        )
        return session

    def update_token(self, bearer_token: str) -> None:
        """Bearer Token만 갱신합니다 (쿠키 유지)."""
        session = self.load_session()
        if not session:
            raise RuntimeError("No session found. Run login first.")
        session.bearer_token = bearer_token
        session.token_captured_at = time.time()
        self.session_file.write_text(
            json.dumps(session.to_dict(), indent=2, ensure_ascii=False)
        )

    def load_session(self) -> Optional[OpalSession]:
        if not self.session_file.exists():
            # 구버전 cookies.json 마이그레이션
            old_file = self.profile_dir / "cookies.json"
            if old_file.exists():
                data = json.loads(old_file.read_text(encoding="utf-8"))
                cookies = data.get("cookies", {})
                session = self.save_session(cookies)
                old_file.unlink()
                return session
            return None
        try:
            data = json.loads(self.session_file.read_text(encoding="utf-8"))
            return OpalSession.from_dict(data)
        except (json.JSONDecodeError, KeyError):
            return None

    def delete_session(self) -> None:
        if self.session_file.exists():
            self.session_file.unlink()

    # ────────────────────────────────────────
    # CDP를 통한 Bearer Token 자동 갱신
    # ────────────────────────────────────────

    def refresh_token_via_cdp(self, port: int = CDP_PORT, timeout: int = 30) -> Optional[str]:
        """
        오팔 페이지를 리로드해 appcatalyst 또는 Drive API 호출을 유발하고
        Authorization 헤더에서 Bearer Token을 캡처합니다.

        우선순위:
          1) appcatalyst.pa.googleapis.com 요청의 토큰 (AppCatalyst 스코프 포함)
          2) 그 외 googleapis.com 요청의 토큰 (폴백)
        """
        try:
            import httpx
            import websocket
        except ImportError as e:
            print(f"ERROR: Missing dependency: {e}")
            return None

        # CDP 탭 조회 — opal.google 탭 우선, 없으면 첫 번째 page 탭
        try:
            tabs = httpx.get(f"http://localhost:{port}/json", timeout=5).json()
            tab = next(
                (t for t in tabs if "opal.google" in t.get("url", "") and t.get("type") == "page"),
                next((t for t in tabs if t.get("type") == "page"), None),
            )
            if not tab:
                print(f"ERROR: No Chrome tab found on port {port}")
                return None
            print(f"CDP: 탭 연결 → {tab.get('url', '')[:60]}")
        except Exception as e:
            print(f"ERROR: CDP connect failed: {e}")
            return None

        ws_url = tab["webSocketDebuggerUrl"]
        try:
            ws = websocket.create_connection(ws_url, timeout=timeout)
        except Exception as e:
            print(f"ERROR: WebSocket connect failed: {e}")
            return None

        try:
            ws.send(json.dumps({"id": 1, "method": "Network.enable"}))
            ws.recv()
            ws.send(json.dumps({"id": 2, "method": "Page.reload"}))
            ws.recv()

            ws.settimeout(timeout)
            appcatalyst_token: Optional[str] = None
            fallback_token: Optional[str] = None

            while True:
                msg = json.loads(ws.recv())
                if msg.get("method") == "Network.requestWillBeSent":
                    req = msg.get("params", {}).get("request", {})
                    url = req.get("url", "")
                    hdrs = req.get("headers", {})
                    auth = hdrs.get("Authorization", hdrs.get("authorization", ""))
                    if not auth.startswith("Bearer"):
                        continue
                    # 1순위: AppCatalyst 전용 토큰
                    if "appcatalyst.pa.googleapis.com" in url:
                        appcatalyst_token = auth
                        print(f"CDP: AppCatalyst 토큰 캡처 ✓ ({url[:60]})")
                        break
                    # 2순위: 그 외 googleapis.com 폴백
                    if "googleapis.com" in url and not fallback_token:
                        fallback_token = auth
                        print(f"CDP: fallback 토큰 캡처 ({url[:60]})")
                        # appcatalyst 토큰 대기 계속
        except websocket.WebSocketTimeoutException:
            print("WARNING: Timeout — appcatalyst 요청 미감지, fallback 토큰 사용")
        except Exception as e:
            print(f"ERROR: WebSocket error: {e}")
        finally:
            ws.close()

        bearer_token = appcatalyst_token or fallback_token
        if bearer_token:
            self.update_token(bearer_token)
            src = "appcatalyst" if appcatalyst_token else "fallback"
            print(f"CDP: 토큰 저장 완료 (출처: {src})")

        return bearer_token

    def refresh_via_oauth2(self) -> Optional[str]:
        """
        저장된 Refresh Token으로 새 Access Token을 발급합니다.
        Chrome 불필요. 자동 갱신.
        """
        session = self.load_session()
        if not session or not session.refresh_token:
            return None

        client_id     = session.client_id     or os.environ.get("GOOGLE_CLIENT_ID", "")
        client_secret = session.client_secret or os.environ.get("GOOGLE_CLIENT_SECRET", "")
        if not client_id or not client_secret:
            return None

        try:
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request

            creds = Credentials(
                token=None,
                refresh_token=session.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=client_id,
                client_secret=client_secret,
                scopes=OAUTH_SCOPES,
            )
            creds.refresh(Request())
            bearer_token = f"Bearer {creds.token}"
            self.update_token(bearer_token)
            print("Bearer token refreshed via OAuth2 (no Chrome needed).")
            return bearer_token
        except Exception as e:
            print(f"OAuth2 refresh failed: {e}")
            return None

    def ensure_token(self, port: int = CDP_PORT) -> Optional[str]:
        """
        유효한 Bearer Token을 반환합니다.
        우선순위: 1) 유효한 기존 토큰  2) OAuth2 Refresh Token  3) CDP 폴백
        """
        session = self.load_session()
        if not session:
            return None
        if session.has_valid_token():
            return session.bearer_token

        # 1순위: Refresh Token 자동 갱신 (Chrome 불필요)
        if session.refresh_token:
            print("Bearer token expired. Refreshing via OAuth2...")
            token = self.refresh_via_oauth2()
            if token:
                return token

        # 2순위: CDP 폴백 (Chrome 필요)
        print("Bearer token expired. Refreshing via CDP...")
        return self.refresh_token_via_cdp(port=port)

    # ────────────────────────────────────────
    # 유효성 검사
    # ────────────────────────────────────────

    def is_authenticated(self) -> bool:
        session = self.load_session()
        return session is not None and bool(session.cookies)

    def validate_token(self) -> bool:
        """Drive API로 실제 인증 검증."""
        session = self.load_session()
        if not session or not session.bearer_token:
            return False
        try:
            import httpx
            r = httpx.get(
                f"{DRIVE_API_BASE}/about?fields=user",
                headers=session.get_drive_headers(),
                timeout=10,
            )
            return r.status_code == 200
        except Exception:
            return False

    def validate_project_access(self, file_id: str = "1YQTJjGO0VnQN5U38CE6hHNIhbcindUXt") -> bool:
        """특정 오팔 프로젝트 파일 접근 가능 여부 확인."""
        session = self.load_session()
        if not session or not session.bearer_token:
            return False
        try:
            import httpx
            r = httpx.get(
                f"{DRIVE_API_BASE}/files/{file_id}?fields=id,name,version",
                headers=session.get_drive_headers(),
                timeout=10,
            )
            if r.status_code == 200:
                data = r.json()
                print(f"  Project: {data.get('name')} (version {data.get('version')})")
                return True
            return False
        except Exception:
            return False

    # ────────────────────────────────────────
    # 상태 요약
    # ────────────────────────────────────────

    def status(self) -> dict:
        session = self.load_session()
        if not session:
            return {"status": "no_session", "cookies": 0, "token": "none"}
        return {
            "status": "ok" if not session.is_cookie_expired() else "cookies_old",
            "cookies": len(session.cookies),
            "cookie_age_hours": round((time.time() - session.extracted_at) / 3600, 1),
            "token": "valid" if session.has_valid_token() else "expired",
            "token_age_minutes": round(session.token_age_minutes(), 1),
            "session_file": str(self.session_file),
        }


def parse_cookie_string(cookie_str: str) -> dict:
    cookies = {}
    for part in cookie_str.split(";"):
        part = part.strip()
        if "=" in part:
            k, _, v = part.partition("=")
            cookies[k.strip()] = v.strip()
    return cookies


def validate_google_cookies(cookies: dict) -> bool:
    required = ["SID", "HSID", "SSID", "APISID", "SAPISID"]
    return any(c in cookies for c in required)


# 기본 인스턴스
opal_auth = OpalAuthManager()
