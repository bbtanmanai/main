#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
keyword_crawl.py
================
Standalone script invoked by the Next.js API route /api/youtube/keyword-crawl.

Reads a single JSON line from stdin:
  {"keywords": [...], "max_results": 10, "regionCode": "KR"}

Outputs SSE-style JSON lines to stdout:
  data: {"type": "progress", "keyword": "...", "count": N, "total": N, "saved": N}\n\n
  data: {"type": "done", "total_saved": N}\n\n
  data: {"type": "error", "keyword": "...", "message": "..."}\n\n
"""
from __future__ import annotations

import io
import json
import math
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ── Windows: force UTF-8 stdout ──────────────────────────────────────────
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ── Load .env (4 levels up from this file) ───────────────────────────────
_ROOT_ENV = Path(__file__).parent.parent.parent.parent / ".env"
if _ROOT_ENV.exists():
    for _line in _ROOT_ENV.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

from googleapiclient.discovery import build  # noqa: E402
from supabase import create_client, Client   # noqa: E402

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
SUPABASE_URL    = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY    = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    or os.environ.get("SUPABASE_KEY", "")
)

# ── Helpers ───────────────────────────────────────────────────────────────

def _sse(obj: dict) -> None:
    sys.stdout.write(f"data: {json.dumps(obj, ensure_ascii=False)}\n\n")
    sys.stdout.flush()


def _calc_viral_score(views: int, likes: int, comments: int, subscribers: int) -> float:
    if views >= 1_000_000:
        view_score = 4.0
    elif views >= 100_000:
        view_score = 3.0 + (math.log10(views) - 5)
    elif views >= 10_000:
        view_score = 2.0 + (math.log10(views) - 4)
    elif views >= 1_000:
        view_score = 1.0 + (math.log10(views) - 3)
    else:
        view_score = 0.0

    if views > 0:
        engagement = (likes + comments) / views
        if engagement >= 0.05:
            eng_score = 3.0
        elif engagement >= 0.02:
            eng_score = 2.0
        elif engagement >= 0.01:
            eng_score = 1.0
        else:
            eng_score = engagement / 0.01
    else:
        eng_score = 0.0

    if subscribers > 0:
        ratio = views / subscribers
        if ratio >= 10:
            spread_score = 3.0
        elif ratio >= 3:
            spread_score = 2.0
        elif ratio >= 1:
            spread_score = 1.0
        else:
            spread_score = ratio
    else:
        spread_score = 1.0

    return round(min(10.0, view_score + eng_score + spread_score), 2)


_supa: Client | None = None

def _get_supabase() -> Client:
    global _supa
    if _supa is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수 누락")
        _supa = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supa


def crawl_keyword(youtube, keyword: str, max_results: int, region_code: str) -> tuple[int, dict]:
    """Search YouTube by keyword, upsert results to Supabase. Returns count saved."""
    search_kwargs: dict = dict(
        q=keyword,
        part="id",
        type="video",
        order="relevance",
        maxResults=min(max_results, 50),
    )
    if region_code:
        search_kwargs["regionCode"] = region_code

    search_res = youtube.search().list(**search_kwargs).execute()
    video_ids = [
        item["id"]["videoId"]
        for item in search_res.get("items", [])
        if item["id"].get("videoId")
    ]

    if not video_ids:
        return 0, {"tier": "none", "min_score": 8, "message": "기준 점수 미달로 수집 영상이 없습니다."}

    # Fetch video details
    details_res = youtube.videos().list(
        id=",".join(video_ids),
        part="snippet,statistics",
    ).execute()

    # Collect unique channel IDs and fetch subscriber counts
    channel_ids = list({item["snippet"]["channelId"] for item in details_res.get("items", [])})
    subs_map: dict[str, int] = {}
    if channel_ids:
        ch_res = youtube.channels().list(
            id=",".join(channel_ids),
            part="statistics",
        ).execute()
        for ch in ch_res.get("items", []):
            subs_map[ch["id"]] = int(ch.get("statistics", {}).get("subscriberCount", 0))

    records = []
    for item in details_res.get("items", []):
        vid_id     = item["id"]
        snippet    = item.get("snippet", {})
        stats      = item.get("statistics", {})
        channel_id = snippet.get("channelId", "")

        views       = int(stats.get("viewCount",    0))
        likes       = int(stats.get("likeCount",    0))
        comments    = int(stats.get("commentCount", 0))
        subscribers = subs_map.get(channel_id, 0)

        records.append({
            "video_id":    vid_id,
            "title":       snippet.get("title", ""),
            "channel":     snippet.get("channelTitle", ""),
            "channel_id":  channel_id,
            "views":       views,
            "subscribers": subscribers,
            "likes":       likes,
            "comments":    comments,
            "viral_score": _calc_viral_score(views, likes, comments, subscribers),
            "url":         f"https://www.youtube.com/watch?v={vid_id}",
            "keyword":     keyword,
            "template_id": "general",
            "published_at": snippet.get("publishedAt") or None,
        })

    if not records:
        return 0, {"tier": "none", "min_score": 8, "message": "기준 점수 미달로 수집 영상이 없습니다."}

    def _is_recent_90_days(iso_ts: str | None) -> bool:
        if not iso_ts:
            return False
        try:
            ts = iso_ts.strip()
            if ts.endswith("Z"):
                ts = ts[:-1] + "+00:00"
            dt = datetime.fromisoformat(ts)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt >= datetime.now(timezone.utc) - timedelta(days=90)
        except Exception:
            return False

    def _score(r: dict) -> float:
        try:
            return float(r.get("viral_score") or 0)
        except Exception:
            return 0.0

    bench_recent = [r for r in records if _score(r) >= 30 and _is_recent_90_days(r.get("published_at"))]
    viral_30     = [r for r in records if _score(r) >= 30]
    score_15     = [r for r in records if _score(r) >= 15]
    score_8      = [r for r in records if _score(r) >= 8]

    picked: list[dict]
    picked_tier: str
    picked_min: int
    if bench_recent:
        picked = bench_recent
        picked_tier = "benchmark"
        picked_min = 30
    elif viral_30:
        picked = viral_30
        picked_tier = "viral"
        picked_min = 30
    elif score_15:
        picked = score_15
        picked_tier = "score15"
        picked_min = 15
    elif score_8:
        picked = score_8
        picked_tier = "score8"
        picked_min = 8
    else:
        return 0, {"tier": "none", "min_score": 8, "message": "기준 점수 미달로 수집 영상이 없습니다."}

    res = _get_supabase().table("crawl_videos").upsert(picked, on_conflict="video_id").execute()
    saved = len(res.data or [])
    return saved, {
        "tier": picked_tier,
        "min_score": picked_min,
        "recent_days": 90 if picked_tier == "benchmark" else None,
        "message": "",
    }


# ── Main ──────────────────────────────────────────────────────────────────

def main() -> int:
    raw = sys.stdin.readline().strip()
    if not raw:
        _sse({"type": "error", "message": "No input received on stdin"})
        return 1

    try:
        args = json.loads(raw)
    except json.JSONDecodeError as e:
        _sse({"type": "error", "message": f"Invalid JSON: {e}"})
        return 1

    keywords:    list[str] = args.get("keywords", [])
    max_results: int       = int(args.get("max_results", 50))
    max_results            = max(1, min(50, max_results))
    region_code: str       = args.get("regionCode", "")

    if not keywords:
        _sse({"type": "error", "message": "keywords list is empty"})
        return 1

    if not YOUTUBE_API_KEY:
        _sse({"type": "error", "message": "YOUTUBE_API_KEY not configured"})
        return 1

    youtube     = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
    total_saved = 0
    total       = len(keywords)

    for idx, keyword in enumerate(keywords, 1):
        try:
            remaining = max_results - total_saved
            if remaining <= 0:
                break
            saved, meta = crawl_keyword(youtube, keyword, remaining, region_code)
            total_saved += saved
            _sse({
                "type": "progress",
                "keyword": keyword,
                "count": idx,
                "total": total,
                "saved": saved,
                **meta,
            })
        except Exception as exc:
            _sse({"type": "error", "keyword": keyword, "message": str(exc), "count": idx, "total": total})

    _sse({
        "type": "done",
        "total_saved": total_saved,
        "no_results_reason": "기준 점수 미달로 수집 영상이 없습니다." if total_saved == 0 else "",
    })
    return 0


if __name__ == "__main__":
    sys.exit(main())
