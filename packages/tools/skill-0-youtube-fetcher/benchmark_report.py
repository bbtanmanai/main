#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import io
import json
import os
import re
import sys
from datetime import datetime, timezone
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

import google.genai as genai  # noqa: E402
from supabase import create_client, Client  # noqa: E402

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or os.environ.get("SUPABASE_KEY", "")

_supa: Client | None = None


def _get_supabase() -> Client:
    global _supa
    if _supa is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수 누락")
        _supa = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supa


def _srt_to_text(srt: str) -> str:
    lines = []
    for raw in (srt or "").splitlines():
        t = raw.strip()
        if not t:
            continue
        if re.fullmatch(r"\d+", t):
            continue
        if "-->" in t:
            continue
        lines.append(t)
    return " ".join(lines)


def _safe_float(v, default=0.0) -> float:
    try:
        return float(v)
    except Exception:
        return default


def main() -> int:
    raw = sys.stdin.readline().strip()
    if not raw:
        sys.stdout.write(json.dumps({"error": "No input received on stdin", "code": "bad_request"}, ensure_ascii=False))
        return 0

    try:
        args = json.loads(raw)
    except json.JSONDecodeError as e:
        sys.stdout.write(json.dumps({"error": f"Invalid JSON: {e}", "code": "bad_request"}, ensure_ascii=False))
        return 0

    video_id = str(args.get("video_id", "")).strip()
    srt = str(args.get("srt", "") or "")
    if not video_id:
        sys.stdout.write(json.dumps({"error": "video_id is required", "code": "bad_request"}, ensure_ascii=False))
        return 0
    if not srt.strip():
        sys.stdout.write(json.dumps({"error": "srt is required", "code": "bad_request"}, ensure_ascii=False))
        return 0

    if not GOOGLE_API_KEY:
        sys.stdout.write(json.dumps({"error": "GOOGLE_API_KEY not configured", "code": "env_missing"}, ensure_ascii=False))
        return 0

    title_in = str(args.get("title", "") or "")
    channel_in = str(args.get("channel", "") or "")
    url_in = str(args.get("url", "") or "")
    views_in = int(args.get("views") or 0)
    likes_in = int(args.get("likes") or 0)
    comments_in = int(args.get("comments") or 0)
    subs_in = int(args.get("subscribers") or 0)
    viral_score_in = _safe_float(args.get("viral_score") or 0.0, 0.0)
    published_at_in = str(args.get("published_at", "") or "")
    created_at_in = str(args.get("created_at", "") or "")

    row = None
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            supa = _get_supabase()
            row_res = (
                supa.table("crawl_videos")
                .select("title, channel, views, likes, comments, subscribers, viral_score, published_at, created_at, url")
                .eq("video_id", video_id)
                .maybe_single()
                .execute()
            )
            row = row_res.data if row_res is not None else None
        except Exception:
            row = None

    title = (row or {}).get("title") or title_in
    channel = (row or {}).get("channel") or channel_in
    url = (row or {}).get("url") or url_in or f"https://www.youtube.com/watch?v={video_id}"
    views = int((row or {}).get("views") or views_in or 0)
    likes = int((row or {}).get("likes") or likes_in or 0)
    comments = int((row or {}).get("comments") or comments_in or 0)
    subs = int((row or {}).get("subscribers") or subs_in or 0)
    viral_score = _safe_float((row or {}).get("viral_score") or viral_score_in or 0.0, 0.0)
    published_at = (row or {}).get("published_at") or published_at_in
    created_at = (row or {}).get("created_at") or created_at_in

    engagement = ((likes + comments * 5) / views) * 100 if views > 0 else 0.0
    view_ratio = (views / subs) * 100 if subs > 0 else 0.0

    transcript_text = _srt_to_text(srt)
    transcript_text = transcript_text[:12000]

    client = genai.Client(api_key=GOOGLE_API_KEY)

    now_kst = datetime.now(timezone.utc).isoformat()

    prompt = f"""
[역할]
당신은 유튜브 콘텐츠 전략 컨설턴트이자, 영상 벤치마킹 리서처입니다.
입력된 SRT 자막과 성과 지표를 기반으로 "왜 이 영상이 벤치마킹 대상인지"를 정밀 분석해 보고서를 작성하세요.

[영상 정보]
- video_id: {video_id}
- url: {url}
- title: {title}
- channel: {channel}
- published_at: {published_at}
- collected_at: {created_at}
- 분석 시각(UTC): {now_kst}

[성과 지표]
- 조회수(views): {views}
- 좋아요(likes): {likes}
- 댓글(comments): {comments}
- 구독자(subscribers): {subs}
- view_ratio(조회수/구독자*100): {view_ratio:.2f}
- engagement_rate((likes + comments*5)/views*100): {engagement:.2f}
- viral_score(시스템 점수): {viral_score}

[벤치마킹 정의]
벤치마킹이란, 그대로 복제하는 것이 아니라 "재현 가능한 메커니즘"을 추출해 우리 콘텐츠에 적용하는 것입니다.

[SRT 자막]
{transcript_text}

[출력 요구사항]
- 한국어로 작성
- 결과는 Markdown으로 출력
- 아래 섹션을 반드시 포함:
  1) Executive Summary (3줄)
  2) 벤치마킹 핵심 이유 TOP 5 (각 1~2문장)
  3) 구조 분석 (훅/전개/전환/클로징) — 자막 근거 인용(짧은 문장) 5개 이상
  4) 설득 장치/감정 트리거/반복 패턴 (체크리스트 형태)
  5) 우리 채널에 적용하는 재현 전략 (A/B 테스트 3개 포함)
  6) 리스크/주의사항 (과장·근거·법적·윤리)
"""

    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        report = (resp.text or "").strip()
    except Exception as e:
        sys.stdout.write(json.dumps({"error": f"Gemini 호출 실패: {e}", "code": "llm_error"}, ensure_ascii=False))
        return 0

    if not report:
        sys.stdout.write(json.dumps({"error": "빈 응답", "code": "llm_empty"}, ensure_ascii=False))
        return 0

    sys.stdout.write(json.dumps({"video_id": video_id, "report": report}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
