#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Opal JS 번들에서 generateWebpageStream / executeStep proto 필드 추출
"""

import sys, re, json, hashlib, time
sys.path.insert(0, '.')
sys.path.insert(0, 'C:/LinkDropV2/packages/tools/skill-2-video-longform1/opal-access')

import httpx
from opal_auth import OpalAuthManager

APP_ID   = "1Mocymk_VJV162306I-lg0Z8QkRJF3N0U"
APP_URL  = f"https://opal.google/app/{APP_ID}"
EDIT_URL = f"https://opal.google/edit/{APP_ID}"

m = OpalAuthManager()
session = m.load_session()
bearer = m.ensure_token() or ""
cookies = session.cookie_header if session and session.cookies else ""
sapisid = session.cookies.get("SAPISID", "") if session and session.cookies else ""


def sapisidhash(sapisid: str, origin: str = "https://opal.google") -> str:
    ts = str(int(time.time()))
    sha1 = hashlib.sha1(f"{ts} {sapisid} {origin}".encode()).hexdigest()
    return f"SAPISIDHASH {ts}_{sha1}"


browser_headers = {
    "Authorization": sapisidhash(sapisid),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9",
    "Referer": "https://opal.google/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}
if cookies:
    browser_headers["Cookie"] = cookies


def fetch_and_search(url: str, patterns: list[str]) -> dict[str, list[str]]:
    """URL 가져와서 패턴 검색."""
    try:
        r = httpx.get(url, headers=browser_headers, timeout=30, follow_redirects=True)
        print(f"  {url[:80]} → {r.status_code} ({len(r.text)} chars)")
        if r.status_code != 200:
            return {}
        text = r.text
        results = {}
        for pat in patterns:
            matches = re.findall(pat, text)
            if matches:
                results[pat] = matches[:10]
        return results
    except Exception as e:
        print(f"  ERROR fetching {url}: {e}")
        return {}


print("1. Opal 앱 페이지 로드 → JS 번들 URL 탐색")
r = httpx.get(APP_URL, headers=browser_headers, timeout=30, follow_redirects=True)
print(f"   status={r.status_code}, len={len(r.text)}")

# JS 번들 URL 추출
js_urls = re.findall(r'src="(/[^"]+\.js[^"]*)"', r.text)
js_urls += re.findall(r'"(https://opal\.google/[^"]+\.js[^"]*)"', r.text)
js_urls += re.findall(r'<script[^>]+src="([^"]+)"', r.text)
js_urls = list(set(js_urls))[:20]
print(f"   JS URLs: {len(js_urls)}")
for u in js_urls[:5]:
    print(f"     {u}")

# HTML에서 직접 패턴 검색
patterns = [
    r'generateWebpageStream["\s]*[,:]\s*"([^"]+)"',
    r'executeStep["\s]*[,:]\s*"([^"]+)"',
    r'"intent"[^,]{0,50}',
    r'"modelName"[^,]{0,50}',
    r'appcatalyst[^"\']{0,100}',
]
print("\n2. 앱 HTML에서 패턴 검색")
for pat in patterns:
    matches = re.findall(pat, r.text)
    if matches:
        print(f"  [{pat[:30]}]: {matches[:3]}")

# JS 번들에서 검색
print("\n3. JS 번들에서 proto 필드 검색")
target_patterns = [
    r'generateWebpageStream[^;]{0,200}',
    r'executeStep[^;]{0,200}',
    r'"intent"[^,]{0,100}',
    r'GenerateWebpageStream[^;]{0,300}',
    r'ExecuteStep[^;]{0,300}',
    r'appcatalyst\.pa\.googleapis[^;]{0,200}',
    r'modelName[^,]{0,80}',
    r'userInstruction[^,]{0,80}',
]

for js_url in js_urls[:8]:
    full_url = js_url if js_url.startswith("http") else f"https://opal.google{js_url}"
    try:
        rj = httpx.get(full_url, headers=browser_headers, timeout=30)
        if rj.status_code != 200:
            continue
        js_text = rj.text
        found = False
        for pat in target_patterns:
            matches = re.findall(pat, js_text)
            if matches:
                if not found:
                    print(f"\n  [{full_url[-50:]}]")
                    found = True
                print(f"    {pat[:40]}: {matches[0][:120]}")
    except Exception as e:
        pass

print("\n완료.")
