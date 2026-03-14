---
name: opal-access
description: >
  오팔(opal.google) 세션 인증 스킬.
  Chrome CDP로 구글 쿠키 + Bearer Token을 동시 추출하고,
  만료 시 자동 갱신합니다. opal-manager/logic.py 의 인증 의존성.
---

# 🔑 Opal Access Skill (오팔 접속 스킬) v2

## 1. 개요

opal-manager 파이프라인의 **인증 레이어**입니다.
Chrome CDP를 통해 쿠키와 Bearer Token을 한 번에 추출하고,
만료 시 Chrome 리로드만으로 자동 갱신합니다.

- **저장 위치**: `~/.linkdrop-opal/profiles/default/session.json`
- **쿠키 유효기간**: 7일 (168h) 경과 시 재로그인 권장
- **Bearer Token 유효기간**: 약 58분 (3500초) — 자동 갱신

---

## 2. 파일 구조

```
opal-access/
├── opal_auth.py              ← 핵심 인증 모듈
│   ├── OpalSession           ← 쿠키 + Bearer Token 데이터 클래스
│   ├── OpalAuthManager       ← 저장/로드/갱신/검증 관리자
│   └── parse_cookie_string() ← 쿠키 문자열 파싱 유틸
├── requirements.txt          ← httpx, websocket-client
├── SKILL.md                  ← 이 문서
└── scripts/
    ├── login.py              ← 로그인 (CDP 자동 / 수동 / extract-only)
    ├── check_session.py      ← 세션 상태 확인 (로컬 / Drive API 검증)
    └── run_render.py         ← 오팔 접속 테스트 (단독 디버깅용)
```

---

## 3. 빠른 시작

### 의존성 설치
```bash
cd packages/tools/skill-2-video-longform1/opal-access
pip install -r requirements.txt
```

### 최초 로그인 (CDP 자동 모드 권장)
```bash
# Chrome을 자동 실행하고, 로그인 후 엔터
python scripts/login.py

# Chrome이 이미 열려있을 때 (bat 연동용)
python scripts/login.py --extract-only

# Chrome 없을 때 수동 붙여넣기
python scripts/login.py --manual
```

### 세션 상태 확인
```bash
# 로컬 캐시 빠른 확인
python scripts/check_session.py

# Drive API로 실제 검증 (Bearer Token 자동 갱신 포함)
python scripts/check_session.py --validate
```

### 단독 접속 테스트 (파이프라인 실행 전 점검)
```bash
# 기본 앱 접속 테스트
python scripts/run_render.py --check

# 특정 프로젝트 접속
python scripts/run_render.py 1YMGfiDKmKWTu5sBt5RCBZwFkxZtdYtfx
```

---

## 4. 핵심 모듈 (`opal_auth.py`) API

```python
from opal_auth import OpalAuthManager

auth = OpalAuthManager()

# ── 세션 관리 ──
auth.save_session(cookies, bearer_token="")  # 저장
session = auth.load_session()                # 로드 → OpalSession | None
auth.delete_session()                        # 삭제

# ── 토큰 갱신 ──
auth.ensure_token()          # 유효 Bearer Token 반환 (만료 시 CDP 자동 갱신)
auth.refresh_token_via_cdp() # CDP 리로드로 Bearer Token 강제 갱신

# ── 유효성 검사 ──
auth.is_authenticated()           # 로컬 세션 존재 여부 (bool)
auth.validate_token()             # Drive API 실제 검증 (bool)
auth.validate_project_access(file_id)  # 특정 오팔 프로젝트 접근 확인

# ── 상태 요약 ──
auth.status()
# → {"status": "ok"|"cookies_old"|"no_session",
#    "cookies": N, "cookie_age_hours": N,
#    "token": "valid"|"expired", "token_age_minutes": N}

# ── OpalSession 메서드 ──
session.get_drive_headers()    # Google Drive API 요청 헤더 (Bearer Token)
session.get_browser_headers()  # 쿠키 기반 브라우저 요청 헤더
session.has_valid_token()      # Bearer Token 유효 여부 (bool)
session.is_cookie_expired()    # 쿠키 7일 초과 여부 (bool)
```

---

## 5. 인증 흐름 (Chrome CDP)

```
1. Chrome 실행 (--remote-debugging-port=9222)
   └─ user-data-dir: ~/.linkdrop-opal/chrome-profile/
   └─ 대상: https://opal.google/edit/1HveRb71BKf_XljWZxILm5B276qA7A8oC

2. 사용자 Google 로그인 (수동)

3. CDP WebSocket 연결
   GET http://localhost:9222/json → ws_url

4. Network.getAllCookies → google.com 도메인 필터링

5. Page.reload → Network.requestWillBeSent 이벤트 감시
   → googleapis.com 요청의 Authorization: Bearer ... 캡처

6. ~/.linkdrop-opal/profiles/default/session.json 저장
   {"cookies": {...}, "bearer_token": "Bearer ...", "extracted_at": ..., "token_captured_at": ...}
```

---

## 6. 세션 유지 정책

| 항목 | 내용 |
|------|------|
| 저장 형식 | `session.json` (쿠키 + Bearer Token 통합) |
| 쿠키 만료 기준 | 7일(168h) 경과 시 재로그인 |
| Bearer Token 만료 | 3500초(약 58분) → `ensure_token()` 자동 갱신 |
| 핵심 쿠키 | `SID`, `HSID`, `SSID`, `APISID`, `SAPISID` |
| 구버전 마이그레이션 | `cookies.json` 발견 시 `session.json` 으로 자동 변환 |

---

## 7. 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| `CDP 접속 실패` | Chrome이 CDP 모드로 미실행 | `python login.py` 재실행 |
| `인증 실패 (401/403)` | 쿠키 만료 | `python login.py` 재로그인 |
| `Bearer Token expired` | 58분 경과 | `python check_session.py --validate` (자동 갱신) |
| `Google 로그인 리디렉션` | 세션 완전 만료 | `python login.py` 재로그인 |
| `httpx/websocket 없음` | 의존성 미설치 | `pip install -r requirements.txt` |
| `Chrome 없음` | Chrome 미설치 | `python login.py --manual` 수동 입력 |

---

*본 스킬은 opal-manager/logic.py 의 인증 의존성 모듈입니다.*
*NotebookLM MCP (`packages/tools/notebooklm-cli`) 인증 패턴을 참조하여 설계됨.*
