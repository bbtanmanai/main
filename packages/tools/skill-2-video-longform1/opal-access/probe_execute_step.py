#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
executeStep API 구조 탐구
--------------------------
appcatalyst.pa.googleapis.com/v1beta1/executeStep 의 요청 형식을 역추적합니다.
에러 응답도 귀중한 정보 — 필드 이름/구조를 알려줍니다.
"""

import sys, asyncio, json, hashlib, time
sys.path.insert(0, '.')
sys.path.insert(0, 'C:/LinkDropV2/packages/tools/skill-2-video-longform1/opal-access')

import httpx
from opal_auth import OpalAuthManager

APP_ID     = "1Mocymk_VJV162306I-lg0Z8QkRJF3N0U"
APP_URL    = f"https://opal.google/app/{APP_ID}"
EDIT_URL   = f"https://opal.google/edit/{APP_ID}"
ENDPOINT   = "https://appcatalyst.pa.googleapis.com/v1beta1/executeStep"
STREAM_EP  = "https://appcatalyst.pa.googleapis.com/v1beta1/generateWebpageStream?alt=sse"

m = OpalAuthManager()
session = m.load_session()
bearer  = m.ensure_token() or ""
access_token = bearer.removeprefix("Bearer ").strip()
cookies = session.cookie_header if session and session.cookies else ""


def make_headers(referer: str = EDIT_URL, include_auth: bool = True) -> dict:
    h = {
        "Content-Type": "application/json",
        "Referer": referer,
        "Origin": "https://opal.google",
        "x-browser-channel": "stable",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
    if include_auth:
        h["Authorization"] = bearer
    if cookies:
        h["Cookie"] = cookies
    return h


def sapisidhash_header(sapisid: str, origin: str = "https://opal.google") -> str:
    """브라우저 방식 SAPISIDHASH Authorization 헤더 생성."""
    ts = str(int(time.time()))
    data = f"{ts} {sapisid} {origin}"
    sha1 = hashlib.sha1(data.encode()).hexdigest()
    return f"SAPISIDHASH {ts}_{sha1}"


def probe(label: str, body: dict, headers: dict) -> None:
    """POST 전송 후 상태코드/응답 출력."""
    try:
        r = httpx.post(ENDPOINT, json=body, headers=headers, timeout=20)
        print(f"\n[{label}] status={r.status_code}")
        try:
            d = r.json()
            print(json.dumps(d, indent=2, ensure_ascii=False)[:800])
        except Exception:
            print(r.text[:400])
    except Exception as e:
        print(f"[{label}] ERROR: {e}")


async def probe_stream(label: str, body: dict, headers: dict) -> None:
    """generateWebpageStream SSE 시도."""
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            async with c.stream("POST", STREAM_EP, json=body, headers=headers) as r:
                print(f"\n[{label}] status={r.status_code}")
                lines = []
                async for line in r.aiter_lines():
                    lines.append(line)
                    if len(lines) >= 5:
                        break
                for ln in lines:
                    print(f"  {ln[:120]}")
    except Exception as e:
        print(f"[{label}] ERROR: {e}")


# ── SAPISID 쿠키로 SAPISIDHASH 헤더 생성 ────────────────────────────────────
if session and session.cookies:
    sapisid = session.cookies.get("SAPISID", "")
else:
    sapisid = ""
sapisid_header = sapisidhash_header(sapisid) if sapisid else ""

h_bearer   = make_headers(include_auth=True)
h_no_auth  = make_headers(include_auth=False)
h_sapisidhash = {**make_headers(include_auth=False)}
if sapisid_header:
    h_sapisidhash["Authorization"] = sapisid_header
    print(f"SAPISIDHASH header: {sapisid_header[:60]}...")
else:
    print("SAPISID 쿠키 없음 — SAPISIDHASH 시도 불가")

print(f"\n앱 ID: {APP_ID}")
print(f"Bearer: {bearer[:40]}...")
print(f"쿠키 길이: {len(cookies)}")
print("=" * 60)

# ── 1. executeStep: 최소 body (구조 오류 메시지 확인) ─────────────────────
probe("executeStep-empty",    {}, h_bearer)
probe("executeStep-appId",    {"appId": APP_ID}, h_bearer)
probe("executeStep-full",     {
    "appId":       APP_ID,
    "input":       "Create a cinematic background for: 혈압을 낮추는 식품",
    "accessToken": access_token,
}, h_bearer)

# ── 2. executeStep: /app/ Referer ─────────────────────────────────────────
probe("executeStep-appRef",   {"appId": APP_ID}, make_headers(referer=APP_URL))

# ── 3. SAPISIDHASH auth (브라우저 방식) ──────────────────────────────────────
if sapisid_header:
    probe("executeStep-sapisidhash", {"appId": APP_ID}, h_sapisidhash)

# ── 4. generateWebpageStream: SAPISIDHASH auth ───────────────────────────
if sapisid_header:
    body_stream = {
        "intent": "cinematic background visual, no text, 1920x1080",
        "modelName": "gemini-2.5-flash",
        "userInstruction": "Create a full-screen background visual.",
        "contents": [{"role": "user", "parts": [{"text": "혈압을 낮추는 식품의 분위기"}]}],
        "accessToken": access_token,
    }
    asyncio.run(probe_stream("stream-sapisidhash", body_stream, h_sapisidhash))

print("\n" + "=" * 60)
print("탐구 완료.")
