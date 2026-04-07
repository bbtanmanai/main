#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
요즘 뜨는 영상 컨셉 수집기
===========================
① Google Trends  → 월간 급상승 검색어
② YouTube Search → 바이럴 영상 (조회수/구독자 비율 기준)
③ 영상 컨셉 패턴 → 제목에서 훅 구조 추출

실행:
  python -X utf8 collect_viral.py
"""
from __future__ import annotations

import io
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── stdout UTF-8 강제 ─────────────────────────────────────────────────────────
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ── .env 로드 ─────────────────────────────────────────────────────────────────
_ROOT_ENV = Path(__file__).parent.parent.parent.parent / ".env"
if _ROOT_ENV.exists():
    for _line in _ROOT_ENV.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            _v = _v.strip().strip('"').strip("'")
            os.environ.setdefault(_k.strip(), _v)

YOUTUBE_API_KEY     = os.environ.get("YOUTUBE_API_KEY", "")
NAVER_CLIENT_ID     = os.environ.get("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET", "")

_HERE          = Path(__file__).parent
_NAVER_KW_FILE = _HERE / "naver_datalab_keywords.json"

def _today() -> str:
    return datetime.now().strftime("%Y-%m-%d")

def _date_n_days_ago(n: int) -> str:
    from datetime import timedelta
    return (datetime.now() - timedelta(days=n)).strftime("%Y-%m-%d")


# ── 1. Naver DataLab 급상승 검색어 ───────────────────────────────────────────
def fetch_rising_keywords() -> tuple[list[dict], str]:
    """
    Naver DataLab 검색어트렌드 → 최근 30일 급상승 키워드
    Google Trends pytrends는 국내 IP 차단 이슈로 Naver로 대체
    """
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        return [], "no_key"

    naver_kw: dict = {}
    if _NAVER_KW_FILE.exists():
        naver_kw = json.loads(_NAVER_KW_FILE.read_text(encoding="utf-8"))
    if not naver_kw:
        return [], "error: naver_datalab_keywords.json 없음"

    url = "https://openapi.naver.com/v1/datalab/search"
    headers = {
        "X-Naver-Client-Id":     NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
        "Content-Type":          "application/json",
    }

    keyword_scores: dict[str, float] = {}

    for category, keywords in naver_kw.items():
        chunks = [keywords[i:i+5] for i in range(0, len(keywords), 5)]
        for chunk in chunks:
            groups = [{"groupName": kw, "keywords": [kw]} for kw in chunk]
            payload = json.dumps({
                "startDate":    _date_n_days_ago(30),
                "endDate":      _today(),
                "timeUnit":     "date",
                "keywordGroups": groups,
            }).encode("utf-8")
            try:
                import urllib.request
                req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                for result in data.get("results", []):
                    name   = result["title"]
                    ratios = [d["ratio"] for d in result.get("data", [])[-7:]]
                    avg    = sum(ratios) / len(ratios) if ratios else 0
                    keyword_scores[name] = keyword_scores.get(name, 0) + avg
            except Exception as e:
                print(f"  [naver_datalab] {category} 오류: {e}", file=sys.stderr)
                continue

    if not keyword_scores:
        return [], "error: 수집 실패"

    sorted_kw = sorted(keyword_scores.items(), key=lambda x: x[1], reverse=True)
    results = [
        {"keyword": kw, "score": round(score, 2), "source": "naver_datalab"}
        for kw, score in sorted_kw[:20]
    ]
    return results, "ok"


# ── 2. YouTube 바이럴 영상 수집 ───────────────────────────────────────────────
# 조회수/구독자 비율이 높은 영상 = 바이럴 지수
# 검색 대상: 사회·경제·심리·라이프스타일 주제
_VIRAL_SEARCH_QUERIES = [
    "부동산 현실",
    "청년 취업 현실",
    "결혼 포기",
    "직장인 현실",
    "1인 가구 생활",
    "이혼 현실",
    "세대 갈등",
    "노후 준비",
    "심리 치유",
    "가족 갈등",
    "경제 위기",
    "물가 폭등",
]

def _get_channel_subscriber(youtube, channel_id: str) -> int:
    """채널 구독자 수 조회"""
    try:
        res = youtube.channels().list(
            part="statistics",
            id=channel_id
        ).execute()
        items = res.get("items", [])
        if items:
            return int(items[0]["statistics"].get("subscriberCount", 0))
    except Exception:
        pass
    return 0


def fetch_youtube_viral() -> tuple[list[dict], str]:
    """
    YouTube Search → 각 영상 조회수 + 채널 구독자 수 → 바이럴 지수 계산
    바이럴 지수 = 조회수 / max(구독자수, 1000)
    """
    if not YOUTUBE_API_KEY:
        return [], "no_key"
    try:
        from googleapiclient.discovery import build
        youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

        video_ids = []
        video_meta = {}  # video_id → {title, channel_id, channel_title}

        # 검색어별 상위 3개 영상 수집
        for query in _VIRAL_SEARCH_QUERIES:
            try:
                res = youtube.search().list(
                    part="snippet",
                    q=query,
                    type="video",
                    regionCode="KR",
                    relevanceLanguage="ko",
                    order="viewCount",
                    maxResults=3,
                    publishedAfter="2025-01-01T00:00:00Z",  # 최근 1년
                ).execute()
                for item in res.get("items", []):
                    vid = item["id"].get("videoId", "")
                    if vid and vid not in video_meta:
                        video_ids.append(vid)
                        video_meta[vid] = {
                            "title":         item["snippet"]["title"],
                            "channel_id":    item["snippet"]["channelId"],
                            "channel_title": item["snippet"]["channelTitle"],
                            "query":         query,
                        }
            except Exception:
                continue

        if not video_ids:
            return [], "error: 영상 수집 실패"

        # 조회수 일괄 조회 (50개 단위)
        view_map = {}
        for i in range(0, len(video_ids), 50):
            chunk = video_ids[i:i+50]
            try:
                res = youtube.videos().list(
                    part="statistics",
                    id=",".join(chunk)
                ).execute()
                for item in res.get("items", []):
                    view_map[item["id"]] = int(
                        item["statistics"].get("viewCount", 0)
                    )
            except Exception:
                continue

        # 채널 구독자 수 (중복 제거)
        channel_ids = list({v["channel_id"] for v in video_meta.values()})
        sub_map = {}
        for i in range(0, len(channel_ids), 50):
            chunk = channel_ids[i:i+50]
            try:
                res = youtube.channels().list(
                    part="statistics",
                    id=",".join(chunk)
                ).execute()
                for item in res.get("items", []):
                    sub_map[item["id"]] = int(
                        item["statistics"].get("subscriberCount", 1000)
                    )
            except Exception:
                continue

        # 바이럴 지수 계산
        results = []
        for vid in video_ids:
            meta = video_meta[vid]
            views = view_map.get(vid, 0)
            subs  = sub_map.get(meta["channel_id"], 1000)
            viral_score = round(views / max(subs, 1000), 2)

            results.append({
                "video_id":      vid,
                "title":         meta["title"],
                "channel_title": meta["channel_title"],
                "query":         meta["query"],
                "views":         views,
                "subscribers":   subs,
                "viral_score":   viral_score,
                "url":           f"https://www.youtube.com/watch?v={vid}",
            })

        # 바이럴 지수 내림차순 정렬 → 상위 20개
        results.sort(key=lambda x: x["viral_score"], reverse=True)
        return results[:20], "ok"

    except Exception as e:
        return [], f"error: {e}"


# ── 3. 영상 컨셉 패턴 추출 ────────────────────────────────────────────────────
# 제목에서 훅 구조(감정 + 사실 폭로 + 반전) 패턴을 분류
_HOOK_PATTERNS = [
    (r"(충격|경악|경고|주의|반전|반드시|절대|진짜)", "감정 훅"),
    (r"(현실|실제|진실|사실|폭로|밝혀)", "팩트 폭로"),
    (r"(이유|원인|비밀|이면|속사정|배후)", "궁금증 유발"),
    (r"(망한|파산|폐업|이혼|해고|실패)", "위기·공포"),
    (r"(살아남|극복|탈출|성공|희망|해결)", "극복·희망"),
    (r"(비교|vs|차이|다른점|공통점)", "비교·분석"),
    (r"([0-9]+가지|[0-9]+개|[0-9]+번)", "숫자 나열"),
]

def classify_hook(title: str) -> list[str]:
    hooks = []
    for pattern, label in _HOOK_PATTERNS:
        if re.search(pattern, title):
            hooks.append(label)
    return hooks if hooks else ["일반"]


def extract_concepts(viral_videos: list[dict]) -> list[dict]:
    """바이럴 영상 제목에서 컨셉 패턴 분석"""
    concept_counter: dict[str, int] = {}
    concept_examples: dict[str, list[str]] = {}

    for v in viral_videos:
        hooks = classify_hook(v["title"])
        for h in hooks:
            concept_counter[h] = concept_counter.get(h, 0) + 1
            concept_examples.setdefault(h, [])
            if len(concept_examples[h]) < 3:
                concept_examples[h].append(v["title"])

    results = []
    for concept, count in sorted(concept_counter.items(), key=lambda x: x[1], reverse=True):
        results.append({
            "concept":  concept,
            "count":    count,
            "examples": concept_examples.get(concept, []),
        })
    return results


# ── 메인 ──────────────────────────────────────────────────────────────────────
def main():
    print("요즘 뜨는 영상 컨셉 수집 시작...", file=sys.stderr)

    source_status: dict[str, str] = {}
    trends_data: list[dict] = []
    viral_data:  list[dict] = []

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {
            executor.submit(fetch_rising_keywords): "naver_datalab",
            executor.submit(fetch_youtube_viral):   "youtube_viral",
        }
        for future in as_completed(futures):
            source = futures[future]
            try:
                data, status = future.result()
                source_status[source] = status
                if source == "naver_datalab":
                    trends_data = data
                elif source == "youtube_viral":
                    viral_data = data
                print(f"  [{source}] {status} — {len(data)}개", file=sys.stderr)
            except Exception as e:
                source_status[source] = f"error: {e}"
                print(f"  [{source}] 오류: {e}", file=sys.stderr)

    concepts = extract_concepts(viral_data)

    result = {
        "rising_keywords": trends_data,
        "viral_videos":    viral_data,
        "concepts":        concepts,
        "collected_at":    datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_status":   source_status,
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
