#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase 연동 클라이언트
- scenarios 테이블: 생성된 시나리오 저장/조회
- topic_pool 테이블: 7점+ 크롤 토픽 저장/조회
- crawl_videos 테이블: 원천 크롤 데이터 읽기
"""
from __future__ import annotations

import os
from typing import Optional
from supabase import create_client, Client

# ── DDL (최초 1회 Supabase 콘솔에서 실행) ─────────────────────────────────────
SCHEMA_SQL = """
-- 토픽 풀 (크롤 데이터에서 추출한 시나리오 소재)
CREATE TABLE IF NOT EXISTS topic_pool (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic        TEXT NOT NULL,
  template_id  TEXT NOT NULL,
  viral_score  FLOAT NOT NULL,
  source_title TEXT,
  source_url   TEXT,
  used         BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_topic_pool_unused
  ON topic_pool(template_id, used) WHERE used = FALSE;

-- 시나리오 재고 (Gemini 생성 결과)
CREATE TABLE IF NOT EXISTS scenarios (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id   TEXT NOT NULL,
  style         TEXT NOT NULL,
  topic         TEXT NOT NULL,
  script        TEXT NOT NULL,
  scene_count   INT,
  estimated_sec FLOAT,
  viral_seed    FLOAT,
  used          BOOLEAN DEFAULT FALSE,
  used_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scenarios_stock
  ON scenarios(template_id, style, used) WHERE used = FALSE;
"""

_client: Optional[Client] = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or os.environ.get("SUPABASE_KEY", "")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수 누락")
        _client = create_client(url, key)
    return _client


# ── topic_pool ────────────────────────────────────────────────────────────────

def insert_topics(topics: list[dict]) -> int:
    """토픽 풀에 신규 토픽 삽입. 반환: 삽입된 수"""
    if not topics:
        return 0
    client = get_client()
    res = client.table("topic_pool").insert(topics).execute()
    return len(res.data)


def fetch_unused_topics(template_id: str, limit: int = 100) -> list[dict]:
    """미사용 토픽 조회 (viral_score 높은 순)"""
    client = get_client()
    res = (
        client.table("topic_pool")
        .select("*")
        .eq("template_id", template_id)
        .eq("used", False)
        .order("viral_score", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


def mark_topics_used(topic_ids: list[str]) -> None:
    if not topic_ids:
        return
    get_client().table("topic_pool").update({"used": True}).in_("id", topic_ids).execute()


# ── scenarios ─────────────────────────────────────────────────────────────────

def insert_scenarios(scenarios: list[dict]) -> int:
    """시나리오 재고 삽입. 반환: 삽입된 수"""
    if not scenarios:
        return 0
    client = get_client()
    # 1,000개씩 청크 삽입 (Supabase 제한)
    total = 0
    chunk = 500
    for i in range(0, len(scenarios), chunk):
        res = client.table("scenarios").insert(scenarios[i:i+chunk]).execute()
        total += len(res.data)
    return total


def get_stock_levels(templates: list[str], styles: list[str]) -> dict[str, dict[str, int]]:
    """
    템플릿 × 스타일별 미사용 재고 수 반환.
    반환 형식: { "health-senior": { "ranking": 42, "qa": 15, ... }, ... }
    """
    from postgrest import APIError
    client = get_client()
    result: dict[str, dict[str, int]] = {t: {s: 0 for s in styles} for t in templates}

    # 페이지네이션으로 전체 조회 (Supabase 기본 1,000행 한도 우회)
    page_size = 1000
    offset = 0
    while True:
        res = (
            client.table("scenarios")
            .select("template_id, style")
            .eq("used", False)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        rows = res.data or []
        for row in rows:
            t = row["template_id"]
            s = row["style"]
            if t in result and s in result[t]:
                result[t][s] += 1
        if len(rows) < page_size:
            break
        offset += page_size
    return result


def pop_random_scenario(template_id: str, style: Optional[str] = None) -> Optional[dict]:
    """
    미사용 시나리오 랜덤 1개 반환 + used=true 마킹.
    style=None 이면 전체 스타일 중 랜덤.
    """
    client = get_client()
    query = (
        client.table("scenarios")
        .select("*")
        .eq("template_id", template_id)
        .eq("used", False)
    )
    if style:
        query = query.eq("style", style)

    # Supabase는 ORDER BY RANDOM() 직접 불가 → limit 10 가져와서 Python random
    import random
    res = query.limit(10).execute()
    rows = res.data or []
    if not rows:
        return None

    chosen = random.choice(rows)
    from datetime import datetime, timezone
    client.table("scenarios").update({
        "used": True,
        "used_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", chosen["id"]).execute()
    return chosen


# ── crawl_videos (원천 데이터 읽기) ─────────────────────────────────────────────

def fetch_viral_crawl_data(min_score: float = 7.0, limit: int = 500) -> list[dict]:
    """
    크롤 데이터에서 viral_score >= min_score 인 영상 메타데이터 가져오기.
    크롤 테이블명: crawl_videos (실제 테이블명은 production_config에서 설정)
    """
    client = get_client()
    try:
        res = (
            client.table("crawl_videos")
            .select("id, title, channel, views, subscribers, likes, comments, viral_score, url, created_at")
            .gte("viral_score", min_score)
            .order("viral_score", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data or []
    except Exception as e:
        print(f"[Supabase] crawl_videos 조회 실패: {e}")
        return []
