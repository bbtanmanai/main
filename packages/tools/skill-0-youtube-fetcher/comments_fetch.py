#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import io
import json
import os
import sys
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

from googleapiclient.discovery import build  # noqa: E402
from googleapiclient.errors import HttpError  # noqa: E402

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")


def _extract_youtube_http_error(e: HttpError) -> tuple[str, str, str]:
    status = getattr(getattr(e, "resp", None), "status", None) or "unknown"
    reason = ""
    msg = str(e)
    try:
        raw = e.content.decode("utf-8", errors="replace") if getattr(e, "content", None) else ""
        payload = json.loads(raw) if raw else {}
        if isinstance(payload, dict):
            err = payload.get("error") or {}
            msg = err.get("message") or msg
            errors = err.get("errors") or []
            if isinstance(errors, list) and errors:
                first = errors[0] or {}
                if isinstance(first, dict):
                    reason = str(first.get("reason") or "")
    except Exception:
        pass
    return str(status), reason, msg


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
    max_results = int(args.get("max_results", 20))
    max_results = max(1, min(50, max_results))

    if not video_id:
        sys.stdout.write(json.dumps({"error": "video_id is required"}, ensure_ascii=False))
        return 0

    if not YOUTUBE_API_KEY:
        sys.stdout.write(json.dumps({"error": "YOUTUBE_API_KEY not configured"}, ensure_ascii=False))
        return 0

    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    try:
        res = (
            youtube.commentThreads()
            .list(
                part="snippet",
                videoId=video_id,
                maxResults=max_results,
                order="relevance",
                textFormat="plainText",
            )
            .execute()
        )
    except HttpError as e:
        status, reason, msg = _extract_youtube_http_error(e)
        if reason == "commentsDisabled":
            sys.stdout.write(
                json.dumps(
                    {
                        "error": "댓글이 비활성화된 영상입니다.",
                        "code": "comments_disabled",
                        "status": status,
                        "video_id": video_id,
                    },
                    ensure_ascii=False,
                )
            )
            return 0
        sys.stdout.write(
            json.dumps(
                {
                    "error": f"YouTube API 오류({status}): {msg}",
                    "code": reason or "youtube_api_error",
                    "status": status,
                    "video_id": video_id,
                },
                ensure_ascii=False,
            )
        )
        return 0
    except Exception as e:
        sys.stdout.write(
            json.dumps(
                {"error": f"댓글 수집 실패: {e}", "code": "unknown_error", "video_id": video_id},
                ensure_ascii=False,
            )
        )
        return 0

    comments: list[dict] = []
    for item in res.get("items", []):
        sn = (item.get("snippet") or {}).get("topLevelComment", {}).get("snippet", {}) or {}
        comments.append(
            {
                "author": sn.get("authorDisplayName", ""),
                "authorChannelUrl": sn.get("authorChannelUrl", ""),
                "text": sn.get("textDisplay", ""),
                "likeCount": int(sn.get("likeCount", 0) or 0),
                "publishedAt": sn.get("publishedAt", ""),
                "updatedAt": sn.get("updatedAt", ""),
                "replyCount": int((item.get("snippet") or {}).get("totalReplyCount", 0) or 0),
            }
        )

    sys.stdout.write(json.dumps({"video_id": video_id, "comments": comments}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
