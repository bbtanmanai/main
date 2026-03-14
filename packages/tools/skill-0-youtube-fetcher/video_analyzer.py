#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
video_analyzer.py
=================
Standalone script invoked by the Next.js API route /api/youtube/analyze.

Reads a single JSON line from stdin:
  {"video_ids": ["abc123", ...], "batch_size": 5}

Outputs SSE-style JSON lines to stdout:
  data: {"type": "progress", "video_id": "...", "title": "...", "index": N, "total": N, "success": true/false}\n\n
  data: {"type": "done", "analyzed": N, "failed": N}\n\n
  data: {"type": "error", "message": "..."}\n\n
"""
from __future__ import annotations

import io
import json
import os
import re
import sys
from datetime import datetime, timezone
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

import google.genai as genai  # noqa: E402
from supabase import create_client, Client  # noqa: E402
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled  # noqa: E402

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
SUPABASE_URL   = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY   = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    or os.environ.get("SUPABASE_KEY", "")
)

# ── Helpers ───────────────────────────────────────────────────────────────

def _sse(obj: dict) -> None:
    """Write one SSE data line to stdout and flush immediately."""
    sys.stdout.write(f"data: {json.dumps(obj, ensure_ascii=False)}\n\n")
    sys.stdout.flush()


_supa: Client | None = None

def _get_supabase() -> Client:
    global _supa
    if _supa is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수 누락")
        _supa = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supa


def _fetch_transcript(video_id: str) -> str | None:
    """Fetch transcript text for a video. Try Korean → English → auto-generated.
    Returns concatenated text (max 3000 chars), or None if unavailable."""
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
    except (NoTranscriptFound, TranscriptsDisabled, Exception):
        return None

    transcript = None

    # 1. Try Korean (manual)
    try:
        transcript = transcript_list.find_transcript(['ko'])
    except Exception:
        pass

    # 2. Try English (manual)
    if transcript is None:
        try:
            transcript = transcript_list.find_transcript(['en'])
        except Exception:
            pass

    # 3. Try any auto-generated
    if transcript is None:
        try:
            # find_generated_transcript raises if none found
            for t in transcript_list:
                if t.is_generated:
                    transcript = t
                    break
        except Exception:
            pass

    # 4. Fallback: use whatever is first
    if transcript is None:
        try:
            for t in transcript_list:
                transcript = t
                break
        except Exception:
            pass

    if transcript is None:
        return None

    try:
        entries = transcript.fetch()
        text = " ".join(e.get("text", "") for e in entries)
        return text[:3000]
    except Exception:
        return None


def _extract_json_from_text(text: str) -> dict | None:
    """Try to parse JSON from Gemini response, handling markdown code blocks."""
    # Try direct parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Try extracting from ```json ... ``` blocks
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try finding first { ... } block
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass

    return None


def _analyze_with_gemini(transcript_text: str) -> dict:
    """Call Gemini gemini-2.0-flash to analyze transcript. Returns analysis dict."""
    prompt = f"""다음은 유튜브 영상의 자막입니다. 아래 항목을 JSON으로 분석해주세요:
1. summary: 핵심 내용 요약 (200자 이내)
2. keywords: 핵심 키워드 5개 (배열)
3. quality_score: 콘텐츠 품질 점수 0-10 (정보성, 명확성, 유용성 기준)
4. content_type: 콘텐츠 유형 (tutorial/review/news/opinion/vlog/interview/education 중 하나)

JSON만 반환하고 다른 텍스트는 포함하지 마세요.

자막: {transcript_text}"""

    client = genai.Client(api_key=GOOGLE_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
    )
    result = _extract_json_from_text(response.text)
    if result is None:
        raise ValueError(f"JSON 파싱 실패: {response.text[:200]}")
    return result


def analyze_video(video_id: str) -> tuple[bool, str, dict]:
    """Analyze a single video. Returns (success, title, update_data)."""
    supa = _get_supabase()

    # Fetch video title from Supabase
    row_res = supa.table('crawl_videos').select('title').eq('video_id', video_id).maybe_single().execute()
    title = ''
    if row_res is not None and row_res.data:
        title = row_res.data.get('title', '') or ''

    now_iso = datetime.now(timezone.utc).isoformat()

    # Fetch transcript
    transcript_text = _fetch_transcript(video_id)

    if not transcript_text:
        # No transcript available
        update_data = {
            'is_analyzed': True,
            'analyzed_at': now_iso,
            'summary': '자막 없음',
            'content_type': 'unknown',
            'quality_score': None,
            'transcript': None,
            'keywords': [],
        }
        supa.table('crawl_videos').update(update_data).eq('video_id', video_id).execute()
        return True, title, update_data

    # Analyze with Gemini
    analysis = _analyze_with_gemini(transcript_text)

    summary      = str(analysis.get('summary', ''))[:200]
    keywords     = analysis.get('keywords', [])
    if not isinstance(keywords, list):
        keywords = []
    keywords = [str(k) for k in keywords[:10]]
    quality_score_raw = analysis.get('quality_score')
    try:
        quality_score = float(quality_score_raw) if quality_score_raw is not None else None
        if quality_score is not None:
            quality_score = max(0.0, min(10.0, quality_score))
    except (TypeError, ValueError):
        quality_score = None

    valid_types = {'tutorial', 'review', 'news', 'opinion', 'vlog', 'interview', 'education'}
    content_type = str(analysis.get('content_type', 'unknown')).lower()
    if content_type not in valid_types:
        content_type = 'unknown'

    update_data = {
        'transcript': transcript_text,
        'summary': summary,
        'keywords': keywords,
        'quality_score': quality_score,
        'content_type': content_type,
        'is_analyzed': True,
        'analyzed_at': now_iso,
    }
    supa.table('crawl_videos').update(update_data).eq('video_id', video_id).execute()
    return True, title, update_data


# ── Main ──────────────────────────────────────────────────────────────────

def main() -> int:
    raw = sys.stdin.readline().strip()
    if not raw:
        _sse({"type": "error", "message": "stdin에서 입력을 받지 못했습니다"})
        return 1

    try:
        args = json.loads(raw)
    except json.JSONDecodeError as e:
        _sse({"type": "error", "message": f"JSON 파싱 오류: {e}"})
        return 1

    video_ids: list[str] = args.get("video_ids", [])
    batch_size: int = int(args.get("batch_size", 5))

    if not video_ids:
        _sse({"type": "error", "message": "video_ids 목록이 비어 있습니다"})
        return 1

    if not GOOGLE_API_KEY:
        _sse({"type": "error", "message": "GOOGLE_API_KEY가 설정되지 않았습니다"})
        return 1

    total = len(video_ids)
    analyzed = 0
    failed = 0

    for idx, video_id in enumerate(video_ids, 1):
        try:
            success, title, _ = analyze_video(video_id)
            analyzed += 1
            _sse({
                "type": "progress",
                "video_id": video_id,
                "title": title,
                "index": idx,
                "total": total,
                "success": True,
            })
        except Exception as exc:
            failed += 1
            _sse({
                "type": "progress",
                "video_id": video_id,
                "title": "",
                "index": idx,
                "total": total,
                "success": False,
                "error": str(exc),
            })

    _sse({"type": "done", "analyzed": analyzed, "failed": failed})
    return 0


if __name__ == "__main__":
    sys.exit(main())
