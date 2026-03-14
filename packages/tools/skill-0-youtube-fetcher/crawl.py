#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YouTube 바이럴 크롤러
====================
템플릿별 키워드로 YouTube Data API v3를 검색하여
viral_score를 계산한 뒤 Supabase crawl_videos 테이블에 저장합니다.

실행:
  python -X utf8 crawl.py                          # 전체 키워드 크롤
  python -X utf8 crawl.py --template health-senior  # 특정 템플릿만
  python -X utf8 crawl.py --max 50                  # 키워드당 최대 50개
"""
from __future__ import annotations

import argparse
import io
import math
import os
import sys
import time
from datetime import datetime, timezone, timedelta
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

from googleapiclient.discovery import build
from supabase import create_client, Client

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
SUPABASE_URL    = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY    = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or os.environ.get("SUPABASE_KEY", "")

TEMPLATE_KEYWORDS: dict[str, list[str]] = {
    "health-senior":   ["혈압 낮추는 법", "60대 건강관리", "당뇨 예방 음식", "무릎 통증 완화",
                        "면역력 높이는 방법", "노후 건강 습관", "수면 개선법", "고혈압 식단"],
    "stock-news":      ["주식 투자 초보", "ETF 투자 방법", "배당주 추천", "부동산 투자",
                        "재테크 방법", "개인투자자 실수", "금리 영향 주식"],
    "tech-trend":      ["AI 활용법", "ChatGPT 사용법", "인공지능 트렌드", "스마트폰 생산성",
                        "유용한 AI 도구", "테크 뉴스 요약"],
    "wisdom-quotes":   ["인생 명언", "성공 습관", "자기계발 방법", "동기부여 영상",
                        "행복한 삶 비결"],
    "lifestyle":       ["건강한 아침 루틴", "집 정리 정돈", "생활 꿀팁", "스트레스 해소법",
                        "건강 식단 만들기"],
    "shorts-viral":    ["유튜브 쇼츠 바이럴", "30초 건강 팁", "하루 1분 운동",
                        "생활 꿀팁 쇼츠"],
    "insta-marketing": ["SNS 마케팅 방법", "인스타그램 팔로워 늘리기", "콘텐츠 기획",
                        "소상공인 마케팅"],
    "blog-seo":        ["블로그 수익화", "네이버 상위노출", "SEO 최적화", "애드센스 수익"],
    "ai-video-ads":    ["유튜브 알고리즘", "썸네일 클릭률", "영상 편집 기초", "구독자 늘리기"],
    "ai-business":     ["AI 업무 자동화", "노코드 도구", "업무 효율화", "ChatGPT 업무 활용"],
    "digital-product": ["전자책 만들기", "온라인 강의 제작", "디지털 제품 판매"],
    "workflow":        ["업무 시스템", "노션 활용법", "프로젝트 관리", "생산성 도구 추천"],
}


def calc_viral_score(views: int, likes: int, comments: int, subscribers: int) -> float:
    """0~10점 바이럴 점수. 조회수(0~4) + 참여율(0~3) + 확산력(0~3)."""
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


def _build_youtube():
    if not YOUTUBE_API_KEY:
        raise RuntimeError("YOUTUBE_API_KEY 환경변수 누락")
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY)


def search_videos(youtube, keyword: str, max_results: int = 30) -> list[str]:
    published_after = (datetime.now(timezone.utc) - timedelta(days=180)).isoformat()
    res = youtube.search().list(
        q=keyword,
        part="id",
        type="video",
        regionCode="KR",
        relevanceLanguage="ko",
        publishedAfter=published_after,
        maxResults=min(max_results, 50),
        order="viewCount",
    ).execute()
    return [item["id"]["videoId"] for item in res.get("items", [])]


def get_video_details(youtube, video_ids: list[str]) -> list[dict]:
    results = []
    for i in range(0, len(video_ids), 50):
        res = youtube.videos().list(
            id=",".join(video_ids[i:i+50]),
            part="snippet,statistics",
        ).execute()
        results.extend(res.get("items", []))
    return results


def get_channel_subscribers(youtube, channel_ids: list[str]) -> dict[str, int]:
    result = {}
    unique = list(set(channel_ids))
    for i in range(0, len(unique), 50):
        res = youtube.channels().list(
            id=",".join(unique[i:i+50]),
            part="statistics",
        ).execute()
        for item in res.get("items", []):
            result[item["id"]] = int(item["statistics"].get("subscriberCount", 0))
    return result


_supa: Client | None = None

def get_supabase() -> Client:
    global _supa
    if _supa is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수 누락")
        _supa = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supa


def save_videos(records: list[dict]) -> int:
    if not records:
        return 0
    res = get_supabase().table("crawl_videos").upsert(records, on_conflict="video_id").execute()
    return len(res.data)


def get_existing_video_ids() -> set[str]:
    res = get_supabase().table("crawl_videos").select("video_id").execute()
    return {row["video_id"] for row in (res.data or [])}


def crawl_template(template_id: str, keywords: list[str], max_per_keyword: int,
                   existing_ids: set[str], youtube) -> int:
    total_saved = 0
    for keyword in keywords:
        print(f"  [{template_id}] 검색: '{keyword}'")
        try:
            video_ids = search_videos(youtube, keyword, max_results=max_per_keyword)
            new_ids = [v for v in video_ids if v not in existing_ids]
            if not new_ids:
                print(f"    → 신규 없음")
                continue

            details  = get_video_details(youtube, new_ids)
            ch_ids   = [d["snippet"]["channelId"] for d in details]
            subs_map = get_channel_subscribers(youtube, ch_ids)

            records = []
            for item in details:
                stats   = item.get("statistics", {})
                snippet = item["snippet"]
                vid_id  = item["id"]
                ch_id   = snippet["channelId"]

                views       = int(stats.get("viewCount",    0))
                likes       = int(stats.get("likeCount",    0))
                comments    = int(stats.get("commentCount", 0))
                subscribers = subs_map.get(ch_id, 0)

                records.append({
                    "video_id":    vid_id,
                    "title":       snippet.get("title", ""),
                    "channel":     snippet.get("channelTitle", ""),
                    "channel_id":  ch_id,
                    "views":       views,
                    "subscribers": subscribers,
                    "likes":       likes,
                    "comments":    comments,
                    "viral_score": calc_viral_score(views, likes, comments, subscribers),
                    "url":         f"https://www.youtube.com/watch?v={vid_id}",
                    "keyword":     keyword,
                    "template_id": template_id,
                    "published_at": snippet.get("publishedAt") or None,
                })
                existing_ids.add(vid_id)

            saved = save_videos(records)
            high  = sum(1 for r in records if r["viral_score"] >= 7)
            total_saved += saved
            print(f"    → {saved}개 저장 (7점+: {high}개)")
            time.sleep(0.5)

        except Exception as e:
            print(f"    [오류] '{keyword}': {e}")
            time.sleep(2)

    return total_saved


def main() -> int:
    parser = argparse.ArgumentParser(description="YouTube 바이럴 크롤러")
    parser.add_argument("--template", default="all")
    parser.add_argument("--max", type=int, default=30)
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("YouTube 바이럴 크롤러 시작")
    print(f"  대상: {args.template} | 키워드당 최대: {args.max}개")
    print("=" * 60)

    youtube  = _build_youtube()
    existing = get_existing_video_ids()
    print(f"  기존 저장 영상: {len(existing)}개\n")

    if args.template == "all":
        targets = TEMPLATE_KEYWORDS
    elif args.template in TEMPLATE_KEYWORDS:
        targets = {args.template: TEMPLATE_KEYWORDS[args.template]}
    else:
        print(f"[오류] 알 수 없는 템플릿: {args.template}")
        print(f"  사용 가능: {list(TEMPLATE_KEYWORDS.keys())}")
        return 1

    grand_total = 0
    for tmpl, keywords in targets.items():
        print(f"\n▶ 템플릿: {tmpl} ({len(keywords)}개 키워드)")
        saved = crawl_template(tmpl, keywords, args.max, existing, youtube)
        grand_total += saved
        print(f"  소계: {saved}개")

    print(f"\n{'=' * 60}")
    print(f"크롤 완료: 총 {grand_total}개 저장")

    res = get_supabase().table("crawl_videos").select("viral_score").gte("viral_score", 7).execute()
    print(f"7점+ 바이럴 영상: {len(res.data)}개 (시나리오 소재 가능)")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
