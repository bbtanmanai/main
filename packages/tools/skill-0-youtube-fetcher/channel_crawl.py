#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
channel_crawl.py
================
Standalone script invoked by the Next.js API route /api/youtube/crawl.

Reads a single JSON line from stdin:
  {"urls": [...], "genre": "...", "max_results": 30}

Outputs SSE-style JSON lines to stdout:
  data: {"type": "progress", "url": "...", "count": N, "total": N}\n\n
  data: {"type": "done", "total_saved": N}\n\n
  data: {"type": "error", "url": "...", "message": "..."}\n\n
"""
from __future__ import annotations

import io
import json
import math
import os
import re
import sys
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
    """Write one SSE data line to stdout and flush immediately."""
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


def _extract_video_id(url: str):
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'youtu\.be\/([0-9A-Za-z_-]{11})',
        r'shorts\/([0-9A-Za-z_-]{11})',
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None


def _resolve_channel_id(youtube, channel_url: str):
    url = channel_url.strip().rstrip('/')

    m = re.search(r'/channel/(UC[\w-]+)', url)
    if m:
        return m.group(1)

    m = re.search(r'/@([\w.-]+)', url)
    if m:
        handle = m.group(1)
        try:
            res = youtube.channels().list(forHandle=f'@{handle}', part='id').execute()
            items = res.get('items', [])
            if items:
                return items[0]['id']
        except Exception:
            pass
        try:
            res = youtube.search().list(q=handle, type='channel', part='id', maxResults=1).execute()
            items = res.get('items', [])
            if items:
                return items[0]['id']['channelId']
        except Exception:
            pass
        return None

    m = re.search(r'(?:/c/|/user/)([\w.-]+)', url)
    if m:
        name = m.group(1)
        try:
            res = youtube.search().list(q=name, type='channel', part='id', maxResults=1).execute()
            items = res.get('items', [])
            if items:
                return items[0]['id']['channelId']
        except Exception:
            pass
        return None

    video_id = _extract_video_id(url)
    if video_id:
        try:
            res = youtube.videos().list(part='snippet', id=video_id).execute()
            items = res.get('items', [])
            if items:
                return items[0]['snippet']['channelId']
        except Exception:
            pass

    return None


_supa: Client | None = None

def _get_supabase() -> Client:
    global _supa
    if _supa is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수 누락")
        _supa = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supa


def crawl_channel(youtube, channel_url: str, max_results: int, genre: str) -> int:
    """Crawl one channel, upsert to Supabase, return count saved."""
    channel_id = _resolve_channel_id(youtube, channel_url)
    if not channel_id:
        raise ValueError(f"Cannot resolve channel ID from URL: {channel_url}")

    # Channel metadata
    ch_res = youtube.channels().list(id=channel_id, part='snippet,statistics').execute()
    ch_items = ch_res.get('items', [])
    channel_name = channel_id
    channel_thumbnail = ''
    subscribers = 0
    if ch_items:
        ch_snippet = ch_items[0].get('snippet', {})
        ch_stats   = ch_items[0].get('statistics', {})
        channel_name = ch_snippet.get('title', channel_id)
        subscribers  = int(ch_stats.get('subscriberCount', 0))
        thumbs = ch_snippet.get('thumbnails', {})
        channel_thumbnail = (
            thumbs.get('default', {}).get('url', '')
            or thumbs.get('medium', {}).get('url', '')
            or ''
        )

    # Search recent videos
    search_res = youtube.search().list(
        channelId=channel_id,
        part='id',
        type='video',
        order='date',
        maxResults=min(max_results, 50),
    ).execute()
    video_ids = [
        item['id']['videoId']
        for item in search_res.get('items', [])
        if item['id'].get('videoId')
    ]

    if not video_ids:
        return 0

    # Video details
    details_res = youtube.videos().list(
        id=','.join(video_ids),
        part='snippet,statistics',
    ).execute()

    records = []
    for item in details_res.get('items', []):
        vid_id  = item['id']
        snippet = item.get('snippet', {})
        stats   = item.get('statistics', {})

        views    = int(stats.get('viewCount',    0))
        likes    = int(stats.get('likeCount',    0))
        comments = int(stats.get('commentCount', 0))

        record = {
            'video_id':    vid_id,
            'title':       snippet.get('title', ''),
            'channel':     channel_name,
            'channel_id':  channel_id,
            'views':       views,
            'subscribers': subscribers,
            'likes':       likes,
            'comments':    comments,
            'viral_score': _calc_viral_score(views, likes, comments, subscribers),
            'url':         f'https://www.youtube.com/watch?v={vid_id}',
            'keyword':     channel_url,
            'template_id': genre,
            'published_at': snippet.get('publishedAt') or None,
        }
        if channel_thumbnail:
            record['channel_thumbnail'] = channel_thumbnail
        records.append(record)

    if not records:
        return 0

    res = _get_supabase().table('crawl_videos').upsert(records, on_conflict='video_id').execute()
    return len(res.data or [])


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

    urls:        list[str] = args.get("urls", [])
    genre:       str       = args.get("genre", "general")
    max_results: int       = int(args.get("max_results", 30))

    if not urls:
        _sse({"type": "error", "message": "urls list is empty"})
        return 1

    if not YOUTUBE_API_KEY:
        _sse({"type": "error", "message": "YOUTUBE_API_KEY not configured"})
        return 1

    youtube     = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
    total_saved = 0
    total       = len(urls)

    for idx, url in enumerate(urls, 1):
        try:
            saved = crawl_channel(youtube, url, max_results, genre)
            total_saved += saved
            _sse({"type": "progress", "url": url, "count": idx, "total": total, "saved": saved})
        except Exception as exc:
            _sse({"type": "error", "url": url, "message": str(exc), "count": idx, "total": total})

    _sse({"type": "done", "total_saved": total_saved})
    return 0


if __name__ == "__main__":
    sys.exit(main())
