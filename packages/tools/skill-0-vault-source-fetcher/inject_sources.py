#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NotebookLM Vault 노트북 소스 자동 투입
======================================
Supabase crawl_videos에서 템플릿별 상위 YouTube URL을 가져와
각 NotebookLM 노트북에 소스로 추가합니다.

실행:
  python -X utf8 inject_sources.py              # 전체 12개 노트북
  python -X utf8 inject_sources.py --template health-senior  # 특정 노트북만
  python -X utf8 inject_sources.py --count 20   # 노트북당 최대 소스 수 (기본 20)
"""
from __future__ import annotations

import argparse
import io
import os
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# .env 로드
_ROOT_ENV = Path(__file__).parent.parent.parent.parent / ".env"
if _ROOT_ENV.exists():
    for _line in _ROOT_ENV.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

from supabase import create_client
from notebooklm_tools.cli.utils import get_client as get_nlm_client
from notebooklm_tools.services.sources import add_source as nlm_add_source

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or os.environ.get("SUPABASE_KEY", "")

# 템플릿 → NotebookLM 노트북 ID 매핑
NOTEBOOK_MAP: dict[str, str] = {
    "health-senior":   "b9d4db2d-bc89-46a6-b5ec-b85579c8dc30",
    "stock-news":      "a8891e02-4fc9-4593-8fc7-fb13333ea6a7",
    "tech-trend":      "1522568a-5833-45f4-baa3-8ad2d6afb795",
    "wisdom-quotes":   "6a6dee66-1811-4939-80cc-4ab57f50810b",
    "lifestyle":       "fe5bcad7-cc23-412d-804d-b2d1f0277527",
    "shorts-viral":    "ff2dce84-b2a0-4033-8c0b-030e9c9f8fd9",
    "insta-marketing": "39ee7e22-a2d8-43f1-96c2-3facbe9495c2",
    "blog-seo":        "477e9b88-d64c-4678-9e0f-e2978b3bd1e0",
    "ai-video-ads":    "4aed5fdc-3c29-4682-ae9a-4d699349950e",
    "ai-business":     "e415edf8-2366-4cb5-81d8-fa63bd8f2b34",
    "digital-product": "3c353b30-0945-4d5e-b88f-ce87f54a5784",
    "workflow":        "8508afbe-75a6-4c35-baee-58b60c825b15",
}


def get_top_urls(template_id: str, count: int) -> list[str]:
    """viral_score 상위 URL 조회."""
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    res = (
        client.table("crawl_videos")
        .select("url, title, viral_score")
        .eq("template_id", template_id)
        .order("viral_score", desc=True)
        .limit(count)
        .execute()
    )
    rows = res.data or []
    urls = [r["url"] for r in rows if r.get("url")]
    print(f"  → crawl_videos에서 {len(urls)}개 URL 확보 (top viral_score)")
    return urls


def add_youtube_sources(notebook_id: str, urls: list[str], batch_size: int = 5) -> int:
    """notebooklm_tools Python API로 YouTube URL을 노트북에 추가."""
    if not urls:
        return 0

    success = 0
    with get_nlm_client() as client:
        for i in range(0, len(urls), batch_size):
            batch = urls[i:i + batch_size]
            print(f"  배치 {i//batch_size + 1}: {len(batch)}개 추가 중...")
            for url in batch:
                try:
                    nlm_add_source(client, notebook_id, "url", url=url)
                    success += 1
                except Exception as e:
                    print(f"    오류 ({url[:60]}): {e}")
            print(f"    완료")
            time.sleep(2)  # NotebookLM API rate limit

    return success


def inject_template(template_id: str, notebook_id: str, count: int) -> None:
    print(f"\n▶ [{template_id}] 노트북: {notebook_id[:16]}...")
    urls = get_top_urls(template_id, count)
    if not urls:
        print(f"  ⚠️  crawl_videos에 {template_id} 데이터 없음")
        return

    added = add_youtube_sources(notebook_id, urls)
    print(f"  완료: {added}/{len(urls)}개 소스 투입")


def main() -> int:
    parser = argparse.ArgumentParser(description="NotebookLM 소스 자동 투입")
    parser.add_argument("--template", default="all")
    parser.add_argument("--count", type=int, default=20, help="노트북당 최대 소스 수")
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("NotebookLM Vault 소스 자동 투입")
    print(f"  대상: {args.template} | 노트북당: {args.count}개")
    print("=" * 60)

    if args.template == "all":
        targets = NOTEBOOK_MAP
    elif args.template in NOTEBOOK_MAP:
        targets = {args.template: NOTEBOOK_MAP[args.template]}
    else:
        print(f"[오류] 알 수 없는 템플릿: {args.template}")
        print(f"  사용 가능: {list(NOTEBOOK_MAP.keys())}")
        return 1

    for tmpl, nb_id in targets.items():
        inject_template(tmpl, nb_id, args.count)

    print(f"\n{'=' * 60}")
    print("소스 투입 완료. NotebookLM에서 처리 중...")
    print("확인: nlm notebook list")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
