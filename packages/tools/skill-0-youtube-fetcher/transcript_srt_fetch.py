#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import io
import json
import os
import sys
from datetime import timedelta
from pathlib import Path

if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

_ROOT_ENV = Path(__file__).parent.parent.parent.parent / ".env"
if _ROOT_ENV.exists():
    for _line in _ROOT_ENV.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

from youtube_transcript_api import (  # noqa: E402
    YouTubeTranscriptApi,
    NoTranscriptFound,
    TranscriptsDisabled,
)


def _ts_srt(seconds: float) -> str:
    ms = int(round((seconds - int(seconds)) * 1000))
    td = timedelta(seconds=int(seconds))
    hh, rem = divmod(td.seconds, 3600)
    mm, ss = divmod(rem, 60)
    return f"{hh:02d}:{mm:02d}:{ss:02d},{ms:03d}"


def _pick_transcript(video_id: str):
    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

    try:
        return transcript_list.find_transcript(["ko"]), "ko", False
    except Exception:
        pass

    try:
        return transcript_list.find_transcript(["en"]), "en", False
    except Exception:
        pass

    try:
        for t in transcript_list:
            if t.is_generated:
                lang = getattr(t, "language_code", "") or "auto"
                return t, lang, True
    except Exception:
        pass

    for t in transcript_list:
        lang = getattr(t, "language_code", "") or "auto"
        return t, lang, bool(getattr(t, "is_generated", False))

    return None, "", False


def main() -> int:
    raw = sys.stdin.readline().strip()
    if not raw:
        sys.stdout.write(json.dumps({"error": "No input received on stdin"}, ensure_ascii=False))
        return 0

    try:
        args = json.loads(raw)
    except json.JSONDecodeError as e:
        sys.stdout.write(json.dumps({"error": f"Invalid JSON: {e}"}, ensure_ascii=False))
        return 0

    video_id = str(args.get("video_id", "")).strip()
    if not video_id:
        sys.stdout.write(json.dumps({"error": "video_id is required", "code": "bad_request"}, ensure_ascii=False))
        return 0

    try:
        transcript, lang, generated = _pick_transcript(video_id)
    except TranscriptsDisabled:
        sys.stdout.write(
            json.dumps(
                {"error": "자막이 비활성화된 영상입니다.", "code": "transcripts_disabled", "video_id": video_id},
                ensure_ascii=False,
            )
        )
        return 0
    except NoTranscriptFound:
        sys.stdout.write(
            json.dumps(
                {"error": "자막이 없는 영상입니다.", "code": "no_transcript", "video_id": video_id},
                ensure_ascii=False,
            )
        )
        return 0
    except Exception as e:
        sys.stdout.write(
            json.dumps(
                {"error": f"자막 조회 실패: {e}", "code": "transcript_fetch_failed", "video_id": video_id},
                ensure_ascii=False,
            )
        )
        return 0

    if transcript is None:
        sys.stdout.write(
            json.dumps(
                {"error": "자막이 없는 영상입니다.", "code": "no_transcript", "video_id": video_id},
                ensure_ascii=False,
            )
        )
        return 0

    try:
        entries = transcript.fetch()
    except Exception as e:
        sys.stdout.write(
            json.dumps(
                {"error": f"자막 다운로드 실패: {e}", "code": "transcript_download_failed", "video_id": video_id},
                ensure_ascii=False,
            )
        )
        return 0

    lines: list[str] = []
    idx = 1
    for item in entries:
        text = str(item.get("text", "") or "").strip()
        if not text:
            continue
        start = float(item.get("start", 0.0) or 0.0)
        duration = float(item.get("duration", 0.0) or 0.0)
        end = max(start, start + max(0.0, duration))
        text = text.replace("\n", " ").strip()
        lines.append(str(idx))
        lines.append(f"{_ts_srt(start)} --> {_ts_srt(end)}")
        lines.append(text)
        lines.append("")
        idx += 1

    srt = "\n".join(lines).strip() + ("\n" if lines else "")

    sys.stdout.write(
        json.dumps(
            {"video_id": video_id, "srt": srt, "language": lang, "generated": generated},
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

