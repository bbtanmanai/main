#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
토픽 수집기
-----------
크롤 DB(Supabase crawl_videos)에서 viral_score >= 7 데이터를 읽어
시나리오 소재(topic_pool)로 변환·저장합니다.

템플릿 자동 분류 키워드 매핑:
  각 영상 제목을 분석해 12개 템플릿 중 가장 적합한 것으로 분류.
"""
from __future__ import annotations

import re
from typing import Optional

import supabase_client

# ── 템플릿 분류 키워드 맵 ──────────────────────────────────────────────────────
TEMPLATE_KEYWORDS: dict[str, list[str]] = {
    "health-senior":   ["건강", "혈압", "혈당", "당뇨", "관절", "무릎", "고혈압",
                        "식품", "음식", "영양", "운동", "노후", "시니어", "어르신",
                        "의사", "병원", "치료", "면역", "수면", "다이어트", "체중"],
    "stock-news":      ["주식", "경제", "투자", "금리", "환율", "코스피", "코스닥",
                        "ETF", "부동산", "재테크", "증권", "펀드", "배당", "채권"],
    "tech-trend":      ["AI", "인공지능", "챗GPT", "테크", "기술", "앱", "스마트폰",
                        "로봇", "메타버스", "반도체", "전기차", "스타트업"],
    "wisdom-quotes":   ["명언", "철학", "지혜", "인생", "성공", "마음", "행복",
                        "감사", "긍정", "동기부여", "자기계발", "습관"],
    "lifestyle":       ["생활", "일상", "집", "인테리어", "요리", "레시피", "여행",
                        "취미", "반려", "펫", "가드닝", "DIY", "청소", "정리"],
    "shorts-viral":    ["쇼츠", "릴스", "바이럴", "챌린지", "밈", "유머", "웃긴",
                        "반전", "놀라운", "신기한", "충격", "반응"],
    "insta-marketing": ["마케팅", "브랜드", "SNS", "인스타", "광고", "콘텐츠",
                        "팔로워", "사업", "창업", "소상공인", "홍보"],
    "blog-seo":        ["블로그", "SEO", "검색", "키워드", "글쓰기", "포스팅",
                        "네이버", "구글", "애드센스", "수익"],
    "ai-video-ads":    ["영상광고", "유튜브광고", "영상제작", "편집", "촬영",
                        "썸네일", "조회수", "구독", "알고리즘"],
    "ai-business":     ["AI비즈니스", "자동화", "업무효율", "ChatGPT활용",
                        "노코드", "생산성", "원격근무", "프리랜서"],
    "digital-product": ["디지털제품", "전자책", "온라인강의", "클래스", "PDF",
                        "템플릿", "디자인", "노션", "플리마켓"],
    "workflow":        ["워크플로우", "프로세스", "업무자동화", "시스템",
                        "관리", "일정", "프로젝트", "협업", "툴"],
}

DEFAULT_TEMPLATE = "lifestyle"


def classify_template(title: str) -> str:
    """영상 제목 → 템플릿 ID 자동 분류."""
    title_lower = title.lower()
    scores: dict[str, int] = {}
    for tmpl, keywords in TEMPLATE_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw.lower() in title_lower)
        if count > 0:
            scores[tmpl] = count
    if not scores:
        return DEFAULT_TEMPLATE
    return max(scores, key=lambda k: scores[k])


def extract_clean_topic(title: str) -> str:
    """
    영상 제목에서 순수 주제만 추출.
    예) "혈압에 좋은 음식 TOP5 알려드립니다 (의사가 추천)" → "혈압에 좋은 음식"
    """
    # 괄호·대괄호 내용 제거
    topic = re.sub(r"[\(\[\{].*?[\)\]\}]", "", title)
    # 특수문자 제거 (한글·영문·숫자·공백만 유지)
    topic = re.sub(r"[^\w\s가-힣]", " ", topic)
    # TOP N, 순위, 추천 등 불필요 단어 제거
    noise = ["top", "알려드립니다", "추천합니다", "정리했습니다", "공개합니다",
             "총정리", "완벽정리", "최신", "꼭", "반드시", "절대", "이것만"]
    for n in noise:
        topic = re.sub(n, "", topic, flags=re.IGNORECASE)
    # 연속 공백 정리
    topic = re.sub(r"\s+", " ", topic).strip()
    return topic[:60] if topic else title[:60]


def collect_topics_from_crawl(
    min_score: float = 7.0,
    max_age_days: int = 90,
    limit: int = 500,
) -> list[dict]:
    """
    Supabase crawl_videos에서 바이럴 데이터 읽어 topic_pool 레코드로 변환.
    반환: 삽입 가능한 topic_pool 레코드 리스트
    """
    print(f"[토픽수집] crawl_videos에서 viral_score>={min_score} 데이터 조회 중...")
    raw = supabase_client.fetch_viral_crawl_data(min_score=min_score, limit=limit)

    if not raw:
        print("[토픽수집] 크롤 데이터 없음 → 건너뜀")
        return []

    print(f"[토픽수집] {len(raw)}개 원천 데이터 확보")

    topics: list[dict] = []
    seen: set[str] = set()

    for row in raw:
        raw_title = row.get("title", "").strip()
        if not raw_title:
            continue

        topic = extract_clean_topic(raw_title)
        if not topic or topic in seen:
            continue
        seen.add(topic)

        template_id = classify_template(raw_title)

        topics.append({
            "topic":        topic,
            "template_id":  template_id,
            "viral_score":  float(row.get("viral_score", 0)),
            "source_title": raw_title,
            "source_url":   row.get("url", ""),
            "used":         False,
        })

    print(f"[토픽수집] {len(topics)}개 유니크 토픽 추출 완료")
    return topics


def save_topics_to_pool(topics: list[dict]) -> int:
    """topic_pool 테이블에 저장. 반환: 저장된 수"""
    if not topics:
        return 0
    inserted = supabase_client.insert_topics(topics)
    print(f"[토픽수집] Supabase topic_pool에 {inserted}개 저장 완료")
    return inserted


def get_topics_for_template(template_id: str, count: int = 50) -> list[dict]:
    """특정 템플릿의 미사용 토픽 반환. 부족하면 폴백 토픽 추가."""
    topics = supabase_client.fetch_unused_topics(template_id, limit=count)

    # 토픽이 부족하면 다른 템플릿 토픽으로 채움 (폴백)
    if len(topics) < count:
        fallback = supabase_client.fetch_unused_topics(DEFAULT_TEMPLATE, limit=count - len(topics))
        topics.extend(fallback)

    # 그래도 부족하면 기본 토픽 하드코딩 (최후의 수단)
    if not topics:
        topics = _default_topics(template_id, count)

    return topics[:count]


def _default_topics(template_id: str, count: int) -> list[dict]:
    """크롤 데이터가 없을 때 사용할 기본 토픽 (초기 세팅용)."""
    DEFAULT_TOPICS: dict[str, list[str]] = {
        "health-senior":   ["혈압에 좋은 음식", "60대 근육 지키는 법", "무릎 통증 완화 운동",
                            "당뇨 예방 식단", "면역력 높이는 방법", "수면 질 높이는 법"],
        "stock-news":      ["개인투자자 실수 TOP5", "ETF 장기투자 전략", "배당주 고르는 법"],
        "tech-trend":      ["AI 도구 활용법", "ChatGPT 업무 자동화", "스마트폰 생산성 앱"],
        "wisdom-quotes":   ["인생 후반전 마음가짐", "행복한 노후 습관 5가지"],
        "lifestyle":       ["집 정리 정돈 비법", "건강한 아침 루틴", "스트레스 해소법"],
        "shorts-viral":    ["30초 건강 팁", "하루 1분 스트레칭"],
        "insta-marketing": ["SNS 팔로워 늘리는 법", "콘텐츠 기획 전략"],
        "blog-seo":        ["네이버 블로그 상위노출", "SEO 키워드 찾는 법"],
        "ai-video-ads":    ["유튜브 썸네일 클릭률 높이기", "영상 편집 기초"],
        "ai-business":     ["AI로 업무 자동화", "노코드 도구 추천"],
        "digital-product": ["전자책 만들고 판매하기", "온라인 강의 제작"],
        "workflow":        ["업무 시스템 만들기", "노션 활용법"],
    }
    base = DEFAULT_TOPICS.get(template_id, DEFAULT_TOPICS["health-senior"])
    result = []
    for i, t in enumerate(base * ((count // len(base)) + 1)):
        if i >= count:
            break
        result.append({
            "topic": t, "template_id": template_id,
            "viral_score": 7.0, "source_title": t, "source_url": "", "used": False,
        })
    return result
