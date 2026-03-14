#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
시나리오 생성 엔진
------------------
Gemini 2.5 Flash-Lite + prompt_config.json 기반으로
단건/배치 시나리오를 생성합니다.
"""
from __future__ import annotations

import json
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Optional

from google import genai as _genai
from google.genai import types as _genai_types

# ── 설정 ──────────────────────────────────────────────────────────────────────
GEMINI_MODEL   = "gemini-2.5-flash-lite"
CONFIG_DIR     = Path(__file__).parent / "config"
PROMPT_CONFIG  = json.loads((CONFIG_DIR / "prompt_config.json").read_text(encoding="utf-8"))

TTS_CHARS_PER_SEC  = 4.5
MAX_VIDEO_SEC      = 90.0   # 씬 20개 × 4.5초 (쇼츠 최적화)
MAX_SCENE_COUNT    = 20     # Opal App 병렬 풀 한도
TARGET_SCENE_SEC   = 4.5
TARGET_SCENE_CHARS = int(TARGET_SCENE_SEC * TTS_CHARS_PER_SEC)   # 20자

_gemini_client: Optional[_genai.Client] = None


def _get_client() -> _genai.Client:
    global _gemini_client
    if _gemini_client is None:
        api_key = os.environ.get("GOOGLE_API_KEY", "")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY 환경변수 누락")
        _gemini_client = _genai.Client(api_key=api_key)
    return _gemini_client


# ── 스타일별 지시문 ────────────────────────────────────────────────────────────
STYLE_DIRECTIVES: dict[str, str] = {
    "ranking": """구성: TOP N 랭킹형 (역순 공개로 끝까지 시청 유도)
[씬1] 충격 사실·강한 질문으로 Hook → [씬2~N-2] 낮은 순위부터, 순위마다 ①이름 ②수치/연구 ③체감효과 3단 구조
[반전씬] "사실 많은 분이 이것을 잘못 먹고 있습니다" 필수 1회
[씬N-1] "드디어 1위, 이것을 들으면 깜짝 놀라실 겁니다" 빌드업
[씬N] 요약 + 댓글 실천 다짐 CTA""",

    "storytelling": """구성: 감성 스토리텔링형 (인물 감정이입)
[씬1] 실제 인물(할머니/아버지 등) + 구체적 고통 장면으로 즉시 시작
[씬2~3] 문제 심화 + 절망감
[씬4] 전환점: 우연히 알게 된 방법
[씬5~N-2] 1주/1달/3달 수치 변화 + 감정 표현
[씬N-1] 감동 클라이맥스 (가족 반응·의사 소견)
[씬N] "혹시 지금 비슷한 상황이신가요? 댓글에 남겨주세요" CTA""",

    "qa": """구성: Q&A형 (시청자 의문 정확히 짚어 해소)
[씬1] 시청자가 속으로 궁금해했을 질문 하나로 즉시 시작
[씬2] 많은 사람의 오해 지적 → 긴장감
[씬3~4] 핵심 답변 + "~에 따르면·연구 결과" 근거
[씬5~N-2] 세부 Q&A 연속 (씬 하나 = Q&A 하나)
[반전씬] 전문가조차 놀란 팩트 1개 필수
[씬N] "여러분은 어떻게 생각하시나요? 댓글로 알려주세요" CTA""",

    "comparison": """구성: A vs B 비교형 (명확한 대결 구도)
[씬1] "A vs B, 오늘 완전히 결론 냅니다" 선언
[씬2] A 최대 강점 (수치)
[씬3] B 최대 강점 (수치)
[씬4~5] 카테고리별 교차 비교 + 씬마다 승자 발표
[반전씬] "60대에 한해서는 결과가 달라집니다"
[씬N-1] 최종 판정 + 상황별 추천
[씬N] "A 또는 B, 댓글에 남겨주세요" 투표 CTA""",

    "expert": """구성: 전문가 권위형 (신뢰·근거·설득)
[씬1] "세계보건기구(WHO)/서울대병원 교수가 강력 권고한 것이 있습니다" 권위 Hook
[씬2~3] 문제 규모 수치화 "국내 60대 중 68%가 모릅니다"
[씬4~N-2] 각 씬마다 ①주장 ②메커니즘(왜?) ③수치 증거 3단 구조
[씬N-1] "단, 이런 분들은 의사와 상담 후 실천하세요" 주의사항
[씬N] "오늘 당장 시작할 수 있는 한 가지만 선택하세요" CTA""",

    "before_after": """구성: Before/After형 (극적 대비)
[씬1] Before: 가장 강렬한 고통 장면 ("3년 전 저는 진통제를 하루 4알 먹었습니다")
[씬2~3] Before 심화: 포기했던 것들, 가족의 걱정
[씬4] 전환점: 거창하지 않은 작은 변화 하나
[씬5~N-2] After: 1주/1달/3달 수치 + 감정 변화
[씬N-1] 현재: "15년 만에 처음으로 손자와 등산했습니다"
[씬N] "여러분도 할 수 있습니다. 오늘 저녁 10분만 시작해보세요" CTA""",
}


def _build_formula_block(
    common_formula: Optional[dict],
    template_formula: Optional[dict],
) -> str:
    """공통 + 템플릿별 성공 방정식을 프롬프트 블록으로 변환."""
    if not common_formula and not template_formula:
        return ""

    lines = ["\n━━━ 성공 방정식 (반드시 적용) ━━━"]

    if common_formula:
        lines.append("【공통 성공 패턴】")
        if common_formula.get("universal_hooks"):
            lines.append(f"• 검증된 훅 패턴: {' / '.join(common_formula['universal_hooks'][:3])}")
        if common_formula.get("scene_flow"):
            lines.append(f"• 씬 흐름: {' → '.join(common_formula['scene_flow'])}")
        if common_formula.get("key_success_factors"):
            lines.append(f"• 핵심 성공 요인: {', '.join(common_formula['key_success_factors'][:3])}")
        if common_formula.get("emotional_triggers"):
            lines.append(f"• 감정 트리거: {', '.join(common_formula['emotional_triggers'][:3])}")

    if template_formula:
        lines.append("\n【이 카테고리 전용 방정식】")
        if template_formula.get("top_hook_templates"):
            lines.append(f"• 훅 템플릿: {template_formula['top_hook_templates'][0]}")
        if template_formula.get("scene_structure"):
            lines.append(f"• 씬 구조: {template_formula['scene_structure']}")
        if template_formula.get("winning_scene_flow"):
            lines.append(f"• 씬 흐름: {' → '.join(template_formula['winning_scene_flow'][:5])}")
        if template_formula.get("title_keywords_viral"):
            lines.append(f"• 바이럴 키워드: {', '.join(template_formula['title_keywords_viral'][:8])}")
        if template_formula.get("target_emotion"):
            lines.append(f"• 타겟 감정: {template_formula['target_emotion']}")
        if template_formula.get("authority_signals"):
            lines.append(f"• 권위 신호: {', '.join(template_formula['authority_signals'][:3])}")
        if template_formula.get("forbidden_patterns"):
            lines.append(f"• 금지 패턴: {', '.join(template_formula['forbidden_patterns'])}")
        if template_formula.get("optimal_cta"):
            lines.append(f"• 최적 CTA: {template_formula['optimal_cta']}")

    return "\n".join(lines)


def _build_prompt(
    topic: str,
    style: str,
    nlm_context: str = "",
    common_formula: Optional[dict] = None,
    template_formula: Optional[dict] = None,
) -> str:
    """prompt_config.json + 스타일 지시문 + 성공 방정식 + 토픽을 합쳐 최종 프롬프트 조립."""
    cfg     = PROMPT_CONFIG
    base    = cfg["base"]
    user    = cfg["user_overrides"]
    directive = STYLE_DIRECTIVES.get(style, STYLE_DIRECTIVES["ranking"])

    scene_count  = MAX_SCENE_COUNT
    total_chars  = int(MAX_SCENE_COUNT * TARGET_SCENE_CHARS)

    good_ex  = "\n".join(f"  ✅ {e}" for e in user["examples"]["good"])
    bad_ex   = "\n".join(f"  ❌ {e}" for e in user["examples"]["bad"])
    required = "\n".join(f"  • {r}" for r in user["content_rules"]["required_elements"])
    banned_w = ", ".join(user["content_rules"]["banned_words"])

    context_block = ""
    if nlm_context:
        context_block = f"\n━━━ 참고 지식 (반드시 활용) ━━━\n{nlm_context}\n"

    formula_block = _build_formula_block(common_formula, template_formula)

    custom = user.get("custom_instruction", "").strip()
    custom_block = f"\n━━━ 추가 지시 ━━━\n{custom}" if custom else ""

    return f"""주제: {topic}
{context_block}{formula_block}

━━━ 구성 방식 ━━━
{directive}

━━━ 품질 기준 ━━━
① 첫 씬은 반드시 Hook — 교과서식 오프닝("~에 대해 알아보겠습니다") 절대 금지
② 매 씬마다 수치·이름·근거 중 하나 이상 포함
③ 감정 곡선: 호기심→공감→정보→놀라움→행동의지
④ 마지막 씬에 반드시 CTA

━━━ 필수 요소 ━━━
{required}

━━━ 금지 단어 ━━━
{banned_w}

━━━ 예시 ━━━
좋은 예:
{good_ex}

나쁜 예:
{bad_ex}

━━━ 형식 제약 ━━━
• 대상: {user['target_persona']['age']} / {user['brand_voice']['tone']} 어조 / {user['brand_voice']['honorific']}
• 씬 수: 정확히 {scene_count}개 (최소 15개, 최대 {scene_count}개)
• 씬당 텍스트: {base['format']['scene_chars_min']}~{base['format']['scene_chars_max']}자 (약 4초 분량, 짧고 임팩트 있는 1~2문장)
• 전체 합산: 최대 {total_chars}자
• 출력: [씬N] 나레이션 텍스트만 (주석·설명·메타텍스트 금지){custom_block}"""


def _parse_scene_count(script: str) -> int:
    return len(re.findall(r"\[씬\d+\]", script))


def _estimate_sec(script: str) -> float:
    scenes = re.findall(r"\[씬\d+\]\s*(.+?)(?=\[씬\d+\]|$)", script, re.DOTALL)
    total_chars = sum(len(s.strip()) for s in scenes)
    return round(total_chars / TTS_CHARS_PER_SEC, 1)


def generate_one(
    topic: str,
    style: str,
    template_id: str,
    viral_seed: float = 0.0,
    nlm_context: str = "",
    common_formula: Optional[dict] = None,
    template_formula: Optional[dict] = None,
) -> Optional[dict]:
    """시나리오 1개 생성. 실패 시 None 반환."""
    prompt = _build_prompt(topic, style, nlm_context, common_formula, template_formula)
    cfg    = PROMPT_CONFIG["base"]

    try:
        client   = _get_client()
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=_genai_types.GenerateContentConfig(
                system_instruction=(
                    "당신은 유튜브 구독자 100만 채널의 수석 영상 시나리오 작가입니다. "
                    "요청받은 형식([씬N] 나레이션 텍스트)만 출력하고, "
                    "어떠한 설명·주석·메타 텍스트도 추가하지 마세요."
                ),
                temperature=0.75,
                max_output_tokens=6144,
            ),
        )
        script = (response.text or "").strip()
        if not script:
            return None

        scene_count   = _parse_scene_count(script)
        estimated_sec = _estimate_sec(script)

        # 품질 필터 (씬 수 범위: 15~20)
        if scene_count < 15:
            print(f"  [품질거부] '{topic}' — 씬 {scene_count}개 (최소 15개 필요)")
            return None
        # 20개 초과 시 앞 20개만 사용
        if scene_count > MAX_SCENE_COUNT:
            script_lines = script.split("\n")
            cutoff = f"[씬{MAX_SCENE_COUNT + 1}]"
            trimmed_lines = []
            for line in script_lines:
                if line.startswith(cutoff):
                    break
                trimmed_lines.append(line)
            script = "\n".join(trimmed_lines).strip()
            scene_count = MAX_SCENE_COUNT

        # scenes_json 생성
        scene_matches = re.findall(r"\[씬(\d+)\]\s*(.+?)(?=\[씬\d+\]|$)", script, re.DOTALL)
        scenes_json = [
            {
                "index":         int(n) - 1,
                "text":          t.strip(),
                "estimated_sec": round(len(t.strip()) / TTS_CHARS_PER_SEC, 1),
            }
            for n, t in sorted(scene_matches, key=lambda m: int(m[0]))
            if t.strip()
        ]
        hook = scenes_json[0]["text"] if scenes_json else ""

        return {
            "template_id":   template_id,
            "style":         style,
            "topic":         topic,
            "script":        script,
            "scenes_json":   scenes_json,
            "hook":          hook,
            "scene_count":   scene_count,
            "estimated_sec": estimated_sec,
            "viral_seed":    viral_seed,
            "used":          False,
        }

    except Exception as e:
        print(f"  [Gemini오류] '{topic}' ({style}): {e}")
        return None


def batch_generate(
    template_id: str,
    style: str,
    topics: list[dict],
    count: int,
    workers: int = 20,
    delay_sec: float = 0.1,
    common_formula: Optional[dict] = None,
    template_formula: Optional[dict] = None,
) -> list[dict]:
    """
    topics 리스트에서 count개 시나리오를 병렬 생성.
    topics가 부족하면 반복 사용.
    common_formula + template_formula가 주입되면 성공 방정식 기반 생성.
    """
    topic_cycle: list[dict] = []
    while len(topic_cycle) < count:
        topic_cycle.extend(topics)
    topic_cycle = topic_cycle[:count]

    formula_tag = " [방정식 적용]" if (common_formula or template_formula) else ""
    print(f"  [{template_id}/{style}] {count}개 병렬 생성 시작 (workers={workers}){formula_tag}")

    results: list[dict] = []
    failed = 0

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {
            pool.submit(
                generate_one,
                t["topic"], style, template_id,
                t.get("viral_score", 0.0),
                "",
                common_formula,
                template_formula,
            ): i
            for i, t in enumerate(topic_cycle)
        }
        for future in as_completed(futures):
            result = future.result()
            if result:
                results.append(result)
            else:
                failed += 1
            if delay_sec > 0:
                time.sleep(delay_sec)

    print(f"  [{template_id}/{style}] 완료: {len(results)}개 성공, {failed}개 실패")
    return results
