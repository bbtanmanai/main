#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
formula_analyzer.py
===================
수집된 바이럴 영상 데이터를 Gemini로 분석하여
공통 + 템플릿별 성공 방정식을 추출합니다.

공통 방정식: 12개 카테고리를 가로지르는 보편 성공 패턴
템플릿 방정식: 해당 카테고리에서만 통하는 고유 패턴

두 방정식의 조합이 시나리오 생성 프롬프트에 주입됩니다.
"""
from __future__ import annotations

import json
import os
import re
from typing import Optional

from google import genai as _genai
from google.genai import types as _genai_types

GEMINI_MODEL = "gemini-2.0-flash"

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

_gemini_client: Optional[_genai.Client] = None


def _get_client() -> _genai.Client:
    global _gemini_client
    if _gemini_client is None:
        api_key = os.environ.get("GOOGLE_API_KEY", "")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY 환경변수 누락")
        _gemini_client = _genai.Client(api_key=api_key)
    return _gemini_client


def _parse_json(text: str) -> Optional[dict]:
    """Gemini 응답에서 JSON 추출 (마크다운 코드블록 처리 포함)."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if m:
        try:
            return json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            pass
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass
    return None


def _format_videos(videos: list[dict], max_count: int = 150) -> str:
    """영상 데이터를 Gemini 분석용 텍스트로 포맷."""
    lines = []
    for i, v in enumerate(videos[:max_count], 1):
        lines.append(
            f"{i}. [점수 {v['viral_score']:.1f}] {v['title']}\n"
            f"   채널:{v['channel']} | 조회:{v['views']:,} | 구독:{v['subscribers']:,}"
            f" | 좋아요:{v['likes']:,} | 댓글:{v['comments']:,}"
        )
    return "\n".join(lines)


# ── 공통 방정식 ────────────────────────────────────────────────────────────────

def extract_common_formula(all_videos: list[dict]) -> dict:
    """
    전체 템플릿의 바이럴 영상 → 카테고리 무관 공통 성공 방정식 추출.
    """
    print(f"\n[공통 방정식] {len(all_videos)}개 영상 분석 중...")
    data_str = _format_videos(all_videos, max_count=200)

    prompt = f"""다음은 12개 카테고리에 걸쳐 YouTube 바이럴 점수 30점 이상을 달성한 영상 {len(all_videos)}개의 데이터입니다.

[영상 데이터]
{data_str}

카테고리에 무관하게 공통적으로 나타나는 성공 패턴을 분석하여 아래 JSON 형식으로만 반환하세요.

{{
  "hook_patterns": ["자주 쓰이는 훅 문구 패턴 (최대 10개, 실제 제목 기반 추출)"],
  "title_patterns": {{
    "use_numbers_ratio": 0.0,
    "question_form_ratio": 0.0,
    "negative_form_ratio": 0.0,
    "avg_title_length": 0,
    "common_structures": ["검증된 제목 구조 패턴 (최대 5개, 예: 숫자+주제+효과)"]
  }},
  "scene_flow": ["최적 씬 흐름 순서 (hook→...→cta, 7단계 이내, 각 단계 역할 포함)"],
  "emotional_triggers": ["주요 감정 자극 요소 (최대 5개, 효과 설명 포함)"],
  "key_success_factors": ["핵심 성공 요인 (최대 5개, 구체적 실행 방법 포함)"],
  "cta_patterns": ["효과적인 CTA 패턴 (최대 3개)"],
  "universal_hooks": ["카테고리 불문 통하는 훅 문장 템플릿 (최대 5개, {{주제}} 플레이스홀더 사용)"],
  "thumbnail_title_synergy": "썸네일-제목 연동 패턴 설명 (1~2문장)"
}}"""

    try:
        client   = _get_client()
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=_genai_types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=4096,
            ),
        )
        result = _parse_json(response.text or "")
        if result is None:
            print(f"  [공통 방정식] JSON 파싱 실패 → 빈 방정식 반환")
            result = {}
    except Exception as exc:
        print(f"  [공통 방정식] Gemini 오류: {exc}")
        result = {}

    result["_sample_size"] = len(all_videos)
    print(f"  [공통 방정식] 추출 완료 (항목 {len(result)}개)")
    return result


# ── 템플릿별 방정식 ────────────────────────────────────────────────────────────

def extract_template_formula(template_id: str, videos: list[dict]) -> dict:
    """
    단일 템플릿의 바이럴 영상 → 해당 템플릿만의 성공 방정식 추출.
    공통 방정식에서 다루지 않는 카테고리 고유 패턴에 집중.
    """
    template_name = TEMPLATE_NAMES.get(template_id, template_id)
    print(f"\n  [{template_id}] 템플릿 방정식 분석 중 ({len(videos)}개)...")
    data_str = _format_videos(videos, max_count=100)
    avg_score = round(sum(v["viral_score"] for v in videos) / len(videos), 1) if videos else 0.0

    prompt = f"""다음은 YouTube "{template_name}" 카테고리에서 바이럴 점수 30점 이상을 달성한 영상 {len(videos)}개의 데이터입니다.

[영상 데이터]
{data_str}

이 카테고리만의 고유한 성공 방정식을 분석하여 아래 JSON 형식으로만 반환하세요.
공통 성공 패턴(숫자 사용, 기본 훅 등)이 아닌, 이 카테고리에서만 통하는 특유의 패턴에 집중하세요.

{{
  "top_hook_templates": [
    "이 카테고리 전용 훅 템플릿 (최대 5개, {{주제}} 플레이스홀더 사용, 실제 제목에서 추출)"
  ],
  "title_keywords_viral": ["바이럴된 제목에 자주 등장하는 카테고리 특유 키워드 (최대 15개)"],
  "authority_signals": ["이 카테고리에서 신뢰·권위를 높이는 신호 (예: 의사, 연구결과, 수치)"],
  "scene_structure": "이 카테고리에서 검증된 씬 구성 패턴 (1~2문장 설명)",
  "winning_scene_flow": ["씬별 역할 설명 (예: 씬1=공포 훅, 씬2=문제 심화, 씬3=...)"],
  "target_emotion": "주요 감정 자극 (공포/호기심/욕망/공감/분노/경이감 중 가장 강한 것 + 이유)",
  "content_characteristics": ["이 카테고리 콘텐츠의 핵심 특성 (3~5개)"],
  "key_differentiators": ["공통 방정식과 다른 이 카테고리만의 특징 (3~5개)"],
  "forbidden_patterns": ["이 카테고리에서 효과 없거나 역효과 나는 패턴 (2~3개)"],
  "optimal_cta": "이 카테고리에서 가장 효과적인 CTA 유형과 문구 예시"
}}"""

    try:
        client   = _get_client()
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=_genai_types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=4096,
            ),
        )
        result = _parse_json(response.text or "")
        if result is None:
            print(f"    [{template_id}] JSON 파싱 실패 → 빈 방정식 반환")
            result = {}
    except Exception as exc:
        print(f"    [{template_id}] Gemini 오류: {exc}")
        result = {}

    # 실측값 주입 (Gemini가 틀리게 써도 덮어씌움)
    result["avg_viral_score"]        = avg_score
    result["winning_title_examples"] = [v["title"] for v in videos[:5]]
    result["_sample_size"]           = len(videos)
    print(f"    [{template_id}] 템플릿 방정식 완료")
    return result


# ── 전체 분석 실행 ─────────────────────────────────────────────────────────────

def analyze_all(
    template_videos: dict[str, list[dict]],
) -> tuple[dict, dict[str, dict]]:
    """
    전체 템플릿 영상 데이터 → 공통 + 템플릿별 방정식 추출.

    반환:
      (common_formula, {template_id: template_formula, ...})
    """
    # 전체 영상 합산 (공통 방정식용)
    all_videos: list[dict] = []
    for videos in template_videos.values():
        all_videos.extend(videos)

    # 1단계: 공통 방정식
    common_formula = extract_common_formula(all_videos)

    # 2단계: 템플릿별 방정식
    template_formulas: dict[str, dict] = {}
    for tmpl_id, videos in template_videos.items():
        if not videos:
            print(f"  [{tmpl_id}] 영상 없음 → 방정식 건너뜀")
            template_formulas[tmpl_id] = {}
            continue
        template_formulas[tmpl_id] = extract_template_formula(tmpl_id, videos)

    print(f"\n[분석 완료] 공통 방정식 1개 + 템플릿 방정식 {len(template_formulas)}개")
    return common_formula, template_formulas
