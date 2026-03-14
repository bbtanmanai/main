#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
formula_collector.py
====================
템플릿별 성공 방정식 추출용 YouTube 수집기.

각 템플릿의 키워드들로 전 세계 YouTube를 검색,
viral_score 30점+ 영상을 상위 100개까지 수집합니다.

수집 기준:
  점수 = (조회수 ÷ 구독자수 × 100) × (1 + 참여율 × 0.05)
  참여율 = (좋아요 + 댓글×5) ÷ 조회수 × 100
  → 30점 이상만 채택 (폴백: 15점+)
"""
from __future__ import annotations

import time
from typing import Optional

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

import supabase_client
from topic_collector import TEMPLATE_KEYWORDS

TEMPLATE_NAMES: dict[str, str] = {
    "health-senior":   "시니어 건강",
    "stock-news":      "주식·경제",
    "tech-trend":      "테크·트렌드",
    "wisdom-quotes":   "명언·자기계발",
    "lifestyle":       "라이프스타일",
    "shorts-viral":    "숏폼·바이럴",
    "insta-marketing": "마케팅·SNS",
    "blog-seo":        "블로그·SEO",
    "ai-video-ads":    "영상 제작·광고",
    "ai-business":     "AI 비즈니스",
    "digital-product": "디지털 상품",
    "workflow":        "워크플로우",
}


def _calc_viral_score(views: int, likes: int, comments: int, subscribers: int) -> float:
    """점수 = (조회수 ÷ 구독자수 × 100) × (1 + 참여율 × 0.05)"""
    if subscribers <= 0 or views <= 0:
        return 0.0
    view_ratio = (views / subscribers) * 100
    engagement = ((likes + comments * 5) / views) * 100
    return round(view_ratio * (1 + engagement * 0.05), 2)


def _is_quota_exceeded(exc: Exception) -> bool:
    """YouTube API 쿼터 초과 오류인지 확인."""
    if isinstance(exc, HttpError) and exc.resp.status == 403:
        content = str(exc)
        return "quotaExceeded" in content or "quota" in content.lower()
    return False


class YouTubeKeyRotator:
    """
    여러 API 키를 순환하며 사용.
    쿼터 초과 시 자동으로 다음 키로 전환.
    """
    def __init__(self, api_keys: list[str]):
        self.keys = [k for k in api_keys if k]
        self.idx  = 0
        self._client = self._build()

    def _build(self):
        key = self.keys[self.idx]
        label = f"키{self.idx + 1} (...{key[-6:]})"
        print(f"  [API키] {label} 사용 중")
        return build("youtube", "v3", developerKey=key)

    def rotate(self) -> bool:
        """다음 키로 전환. 남은 키가 없으면 False 반환."""
        next_idx = self.idx + 1
        if next_idx >= len(self.keys):
            return False
        self.idx = next_idx
        print(f"  [API키 전환] 쿼터 초과 → 키{self.idx + 1} (...{self.keys[self.idx][-6:]}) 로 전환")
        self._client = self._build()
        return True

    def execute_with_rotation(self, build_request_fn):
        """
        API 요청 실행. 쿼터 초과 시 키 전환 후 재시도.
        build_request_fn: youtube 클라이언트를 받아 request 객체를 반환하는 함수
        """
        while True:
            try:
                return build_request_fn(self._client).execute()
            except HttpError as exc:
                if _is_quota_exceeded(exc) and self.rotate():
                    continue  # 새 키로 재시도
                raise  # 모든 키 소진 or 다른 오류


def collect_template_videos(
    rotator: YouTubeKeyRotator,
    template_id: str,
    min_score: float = 30.0,
    max_per_keyword: int = 50,
    top_n: int = 100,
    delay_sec: float = 0.3,
) -> list[dict]:
    """
    템플릿의 모든 키워드로 전 세계 YouTube 검색.
    viral_score >= min_score 영상만 필터링하여 상위 top_n개 반환.
    키워드는 단순 검색어가 아닌 '템플릿 주제를 포괄하는 연관어 집합' 역할.
    """
    keywords  = TEMPLATE_KEYWORDS.get(template_id, [])
    seen_ids: set[str] = set()
    candidates: list[dict] = []

    print(f"  [{template_id}] 키워드 {len(keywords)}개 → 전 세계 검색 중...")

    for kw in keywords:
        try:
            # 전 세계 검색 (regionCode 지정 안 함 = 글로벌)
            search_res = rotator.execute_with_rotation(
                lambda yt: yt.search().list(
                    q=kw,
                    part="id",
                    type="video",
                    order="viewCount",
                    maxResults=min(max_per_keyword, 50),
                )
            )

            video_ids = [
                item["id"]["videoId"]
                for item in search_res.get("items", [])
                if item["id"].get("videoId")
            ]
            new_ids = [v for v in video_ids if v not in seen_ids]
            seen_ids.update(new_ids)
            if not new_ids:
                continue

            # 영상 상세 정보
            details_res = rotator.execute_with_rotation(
                lambda yt: yt.videos().list(
                    id=",".join(new_ids),
                    part="snippet,statistics",
                )
            )

            # 채널 구독자 수 일괄 조회
            channel_ids = list({
                item["snippet"]["channelId"]
                for item in details_res.get("items", [])
            })
            subs_map: dict[str, int] = {}
            if channel_ids:
                ch_res = rotator.execute_with_rotation(
                    lambda yt: yt.channels().list(
                        id=",".join(channel_ids),
                        part="statistics",
                    )
                )
                for ch in ch_res.get("items", []):
                    subs_map[ch["id"]] = int(
                        ch.get("statistics", {}).get("subscriberCount", 0)
                    )

            for item in details_res.get("items", []):
                vid_id     = item["id"]
                snippet    = item.get("snippet", {})
                stats      = item.get("statistics", {})
                channel_id = snippet.get("channelId", "")

                views       = int(stats.get("viewCount",    0))
                likes       = int(stats.get("likeCount",    0))
                comments    = int(stats.get("commentCount", 0))
                subscribers = subs_map.get(channel_id, 0)

                score = _calc_viral_score(views, likes, comments, subscribers)
                if score < min_score:
                    continue

                candidates.append({
                    "video_id":       vid_id,
                    "title":          snippet.get("title", ""),
                    "channel":        snippet.get("channelTitle", ""),
                    "channel_id":     channel_id,
                    "views":          views,
                    "subscribers":    subscribers,
                    "likes":          likes,
                    "comments":       comments,
                    "viral_score":    score,
                    "url":            f"https://www.youtube.com/watch?v={vid_id}",
                    "keyword":        kw,
                    "template_id":    template_id,
                    "published_at":   snippet.get("publishedAt") or None,
                    "source_keyword": kw,
                })

            if delay_sec > 0:
                time.sleep(delay_sec)

        except Exception as exc:
            print(f"    [{kw}] 수집 오류: {exc}")
            continue

    # video_id 기준 중복 제거 (더 높은 점수 우선)
    unique: dict[str, dict] = {}
    for v in candidates:
        vid = v["video_id"]
        if vid not in unique or v["viral_score"] > unique[vid]["viral_score"]:
            unique[vid] = v

    sorted_videos = sorted(unique.values(), key=lambda x: x["viral_score"], reverse=True)
    result = sorted_videos[:top_n]

    print(f"  [{template_id}] {len(result)}개 확보 (min_score={min_score}, top_n={top_n})")
    return result


def collect_all_templates(
    api_key: str,
    min_score: float = 30.0,
    max_per_keyword: int = 50,
    top_n: int = 100,
    fallback_min_score: float = 15.0,
    extra_api_keys: list[str] | None = None,
) -> dict[str, list[dict]]:
    """
    12개 전체 템플릿 수집.
    - 30점+ 영상이 10개 미만이면 15점+ 폴백 적용
    - 쿼터 초과 시 extra_api_keys로 자동 전환
    - 수집 영상은 crawl_videos에도 upsert (부산물 활용)
    반환: {template_id: [video, ...], ...}
    """
    all_keys = [api_key] + (extra_api_keys or [])
    rotator  = YouTubeKeyRotator(all_keys)
    result: dict[str, list[dict]] = {}

    for tmpl in TEMPLATE_KEYWORDS.keys():
        videos = collect_template_videos(
            rotator, tmpl,
            min_score=min_score,
            max_per_keyword=max_per_keyword,
            top_n=top_n,
        )

        # 30점+ 부족 시 폴백
        if len(videos) < 10:
            print(f"  [{tmpl}] 30점+ 부족 ({len(videos)}개) → {fallback_min_score}점+ 폴백 적용")
            videos = collect_template_videos(
                rotator, tmpl,
                min_score=fallback_min_score,
                max_per_keyword=max_per_keyword,
                top_n=top_n,
            )

        result[tmpl] = videos

        # crawl_videos 부산물 저장
        if videos:
            _upsert_to_crawl_videos(videos)

    total = sum(len(v) for v in result.values())
    print(f"\n[수집 완료] 전체 {total}개 (12개 템플릿)")
    return result


def _upsert_to_crawl_videos(videos: list[dict]) -> None:
    """수집 영상을 crawl_videos 테이블에도 저장 (중복 무시)."""
    try:
        records = [{
            "video_id":    v["video_id"],
            "title":       v["title"],
            "channel":     v["channel"],
            "channel_id":  v["channel_id"],
            "views":       v["views"],
            "subscribers": v["subscribers"],
            "likes":       v["likes"],
            "comments":    v["comments"],
            "viral_score": v["viral_score"],
            "url":         v["url"],
            "keyword":     v.get("source_keyword", ""),
            "template_id": v["template_id"],
            "published_at": v.get("published_at"),
        } for v in videos]

        client = supabase_client.get_client()
        client.table("crawl_videos").upsert(records, on_conflict="video_id").execute()
        print(f"    crawl_videos upsert {len(records)}개 완료")
    except Exception as exc:
        print(f"    [crawl_videos upsert 오류] {exc}")
