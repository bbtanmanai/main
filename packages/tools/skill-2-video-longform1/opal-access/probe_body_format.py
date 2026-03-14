#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
executeStep / generateWebpageStream 요청 body 형식 탐구
-------------------------------------------------------
SAPISIDHASH 인증으로 400 INVALID_ARGUMENT 를 받는 것이 확인됨.
이제 올바른 body 구조를 찾는다.
"""

import sys, asyncio, json, hashlib, time
sys.path.insert(0, '.')
sys.path.insert(0, 'C:/LinkDropV2/packages/tools/skill-2-video-longform1/opal-access')

import httpx
from opal_auth import OpalAuthManager

APP_ID    = "1Mocymk_VJV162306I-lg0Z8QkRJF3N0U"
EDIT_URL  = f"https://opal.google/edit/{APP_ID}"
APP_URL   = f"https://opal.google/app/{APP_ID}"
EXEC_EP   = "https://appcatalyst.pa.googleapis.com/v1beta1/executeStep"
STREAM_EP = "https://appcatalyst.pa.googleapis.com/v1beta1/generateWebpageStream?alt=sse"

m = OpalAuthManager()
session = m.load_session()
bearer = m.ensure_token() or ""
access_token = bearer.removeprefix("Bearer ").strip()
cookies = session.cookie_header if session and session.cookies else ""
sapisid = session.cookies.get("SAPISID", "") if session and session.cookies else ""


def sapisidhash(sapisid: str, origin: str = "https://opal.google") -> str:
    ts = str(int(time.time()))
    sha1 = hashlib.sha1(f"{ts} {sapisid} {origin}".encode()).hexdigest()
    return f"SAPISIDHASH {ts}_{sha1}"


def headers(referer: str = EDIT_URL) -> dict:
    h = {
        "Authorization": sapisidhash(sapisid),
        "Content-Type": "application/json",
        "Referer": referer,
        "Origin": "https://opal.google",
        "x-browser-channel": "stable",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
    if cookies:
        h["Cookie"] = cookies
    return h


def probe(label: str, body: dict, ep: str = EXEC_EP) -> dict | None:
    try:
        r = httpx.post(ep, json=body, headers=headers(), timeout=20)
        print(f"\n[{label}] status={r.status_code}")
        try:
            d = r.json()
            print(json.dumps(d, indent=2, ensure_ascii=False)[:600])
            return d
        except Exception:
            print(r.text[:400])
            return None
    except Exception as e:
        print(f"[{label}] ERROR: {e}")
        return None


async def probe_stream_sse(label: str, body: dict) -> None:
    try:
        async with httpx.AsyncClient(timeout=60) as c:
            async with c.stream("POST", STREAM_EP, json=body, headers=headers()) as r:
                print(f"\n[{label}] status={r.status_code}")
                count = 0
                async for line in r.aiter_lines():
                    print(f"  {line[:120]}")
                    count += 1
                    if count >= 10:
                        break
    except Exception as e:
        print(f"[{label}] ERROR: {e}")


print(f"SAPISIDHASH: {sapisidhash(sapisid)[:50]}...")
print("=" * 60)

# ── executeStep body 변형 탐구 ────────────────────────────────────────────

# 변형 1: appId 만
probe("exec-appId-only", {"appId": APP_ID})

# 변형 2: fileId (Drive 파일 ID 방식)
probe("exec-fileId", {"fileId": APP_ID})

# 변형 3: name 필드 (GCP API 리소스 명명 규칙)
probe("exec-name", {"name": f"apps/{APP_ID}"})

# 변형 4: app + input
probe("exec-app-input", {
    "app":   {"id": APP_ID},
    "input": "혈압을 낮추는 식품",
})

# 변형 5: appId + stepId + input
probe("exec-step", {
    "appId":  APP_ID,
    "stepId": "output",
    "input":  {"text": "혈압을 낮추는 식품"},
})

# 변형 6: request wrapper
probe("exec-request-wrap", {
    "request": {
        "appId": APP_ID,
        "input": "혈압을 낮추는 식품",
    }
})

# 변형 7: GCP 스타일 — parent resource
probe("exec-parent", {
    "parent": f"files/{APP_ID}",
    "step":   {"input": "혈압을 낮추는 식품"},
})

# ── generateWebpageStream body 변형 탐구 ──────────────────────────────────
print("\n" + "=" * 60)
print("generateWebpageStream 변형 탐구")
print("=" * 60)

# 변형 A: accessToken 제거 (SAPISIDHASH 이미 있으니 중복 제거)
probe("stream-no-accessToken", {
    "intent":      "cinematic background, no text, 1920x1080",
    "modelName":   "gemini-2.5-flash",
    "userInstruction": "Create a full-screen background visual, no text.",
    "contents": [{"role": "user", "parts": [{"text": "혈압을 낮추는 식품의 분위기"}]}],
}, ep=STREAM_EP)

# 변형 B: appId 추가
probe("stream-with-appId", {
    "appId":       APP_ID,
    "intent":      "cinematic background, no text, 1920x1080",
    "modelName":   "gemini-2.5-flash",
    "userInstruction": "Create a full-screen background visual, no text.",
    "contents": [{"role": "user", "parts": [{"text": "혈압을 낮추는 식품의 분위기"}]}],
}, ep=STREAM_EP)

# 변형 C: SSE 정상 스트리밍 시도 (변형 A)
asyncio.run(probe_stream_sse("stream-sse-no-token", {
    "intent":      "cinematic background, no text, 1920x1080",
    "modelName":   "gemini-2.5-flash",
    "userInstruction": "Create a full-screen background visual, no text.",
    "contents": [{"role": "user", "parts": [{"text": "혈압을 낮추는 식품의 분위기"}]}],
}))

print("\n탐구 완료.")
