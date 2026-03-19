#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
비주얼타입 JSON 생성기
=====================
시나리오 텍스트 → Gemini API → 씬별 구조화된 비주얼타입 JSON 출력.
Remotion React 컴포넌트에서 소비.
"""

import json
import os
from pathlib import Path

# .env 로드
_ENV = Path(__file__).parent.parent.parent.parent / ".env"
if _ENV.exists():
    for _line in _ENV.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())


VISUAL_TYPES = [
    "stat_card",          # 핵심 수치 1개 강조 (숫자 + 라벨 + 아이콘)
    "comparison_table",   # A vs B 비교 (2열 표)
    "flowchart",          # 프로세스 흐름 (3~5 노드)
    "timeline",           # 시간순 나열 (3~5 이벤트)
    "ranking_list",       # TOP N 순위 (3~5개)
    "quote_hero",         # 대사/명언 강조 (큰 텍스트 + 화자)
    "split_screen",       # 전후 비교 (Before/After)
    "icon_grid",          # 아이콘 + 라벨 나열 (3~6개)
    "key_point",          # 핵심 포인트 1줄 강조
    "full_visual",        # 배경 이미지 전체 (텍스트 최소, 감성 씬)
]

SYSTEM_PROMPT = """당신은 영상 제작용 비주얼 디자인 전문가입니다.
주어진 시나리오의 각 씬을 분석하여, 각 씬에 가장 적합한 비주얼 타입과 데이터를 JSON으로 출력하세요.

## 사용 가능한 비주얼 타입

1. **stat_card** — 핵심 수치 1개를 크게 강조
   - data: { "value": "40%", "label": "근력 감소율", "sub": "60대 평균", "icon": "muscle", "trend": "down" }

2. **comparison_table** — A vs B 비교표
   - data: { "title": "비교", "col_a": "일반", "col_b": "시니어 전용", "rows": [{"label": "비타민D", "a": "400IU", "b": "800IU"}, ...] }

3. **flowchart** — 프로세스/단계 흐름
   - data: { "title": "과정", "nodes": [{"step": 1, "text": "상담"}, {"step": 2, "text": "처방"}, ...] }

4. **timeline** — 시간순 이벤트
   - data: { "events": [{"time": "1주", "text": "활력 회복"}, {"time": "1달", "text": "근력 증가"}, ...] }

5. **ranking_list** — TOP N 순위
   - data: { "title": "TOP 5", "items": [{"rank": 1, "text": "오메가3", "sub": "혈관 건강"}, ...] }

6. **quote_hero** — 대사/명언을 크게 표시
   - data: { "quote": "내가 뭘 해도 되겠어?", "speaker": "아버지", "emotion": "sad" }

7. **split_screen** — 전후/대비
   - data: { "left_label": "복용 전", "right_label": "복용 후", "left_items": ["무기력", "식욕 저하"], "right_items": ["활력", "식욕 회복"] }

8. **icon_grid** — 아이콘+라벨 그리드
   - data: { "title": "주요 성분", "items": [{"icon": "vitamin_d", "label": "비타민D"}, {"icon": "calcium", "label": "칼슘"}, ...] }

9. **key_point** — 핵심 한 줄 강조
   - data: { "text": "하루 1알이면 충분합니다", "sub": "식후 30분 권장" }

10. **full_visual** — 감성 비주얼 (배경 중심, 텍스트 최소)
    - data: { "mood": "warm", "scene_desc": "따뜻한 가족 식탁 풍경", "overlay_text": "" }

## 규칙
- 각 씬의 **내용과 맥락**을 분석하여 가장 효과적인 비주얼 타입을 선택하세요.
- 연속 3개 이상 같은 타입이 반복되지 않도록 하세요 (시각적 다양성).
- 첫 씬은 `quote_hero` 또는 `full_visual`로 시작하세요 (도입부).
- 마지막 씬은 `key_point` 또는 `quote_hero`로 마무리하세요 (CTA).
- 대사/인용이 있는 씬(따옴표)은 `quote_hero`를 우선 고려하세요.
- 숫자/통계가 있는 씬은 `stat_card`를 우선 고려하세요.
- data의 텍스트는 **한국어**로 작성하세요.

## 출력 형식
반드시 아래 JSON 배열만 출력하세요. 다른 텍스트 없이 JSON만:

```json
[
  { "index": 0, "visual_type": "quote_hero", "data": { ... } },
  { "index": 1, "visual_type": "stat_card", "data": { ... } },
  ...
]
```"""


def generate_visual_types(scenes: list[dict], style_label: str = "") -> list[dict]:
    """
    시나리오 씬 목록 → Gemini API → 비주얼타입 JSON 반환.

    Args:
        scenes: [{"index": 0, "text": "씬 텍스트"}, ...]
        style_label: 화풍 라벨 (참고용)

    Returns:
        [{"index": 0, "visual_type": "quote_hero", "data": {...}}, ...]
    """
    from google import genai

    api_key = os.environ.get("GOOGLE_API_KEY", "")
    if not api_key:
        print("[VisualType] GOOGLE_API_KEY 없음 → 기본값 사용", flush=True)
        return _fallback(scenes)

    # 씬 텍스트 조합
    scene_text = "\n".join(f"[씬{s['index']+1}] {s['text']}" for s in scenes)
    user_prompt = f"화풍: {style_label}\n\n시나리오 ({len(scenes)}개 씬):\n{scene_text}"

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {"role": "user", "parts": [{"text": SYSTEM_PROMPT + "\n\n" + user_prompt}]}
            ],
        )

        raw = response.text.strip()
        # JSON 추출 (```json ... ``` 또는 순수 JSON)
        if "```" in raw:
            raw = raw.split("```json")[-1].split("```")[0].strip()
            if not raw:
                raw = response.text.split("```")[-2].strip()

        result = json.loads(raw)

        if isinstance(result, list) and len(result) == len(scenes):
            print(f"[VisualType] {len(result)}개 씬 비주얼타입 생성 완료", flush=True)
            return result
        else:
            print(f"[VisualType] 씬 수 불일치: {len(result)} vs {len(scenes)} → 보정", flush=True)
            # 부족하면 key_point로 채움
            while len(result) < len(scenes):
                result.append({"index": len(result), "visual_type": "key_point", "data": {"text": scenes[len(result)]["text"][:30], "sub": ""}})
            return result[:len(scenes)]

    except Exception as e:
        print(f"[VisualType] Gemini 오류: {e} → 기본값 사용", flush=True)
        return _fallback(scenes)


def _fallback(scenes: list[dict]) -> list[dict]:
    """Gemini 실패 시 기본 비주얼타입 할당."""
    import re
    result = []
    for i, s in enumerate(scenes):
        text = s["text"]
        # 따옴표 → quote_hero
        if re.search(r"['\u2018\u2019\u201C\u201D\"']", text):
            vt = "quote_hero"
            data = {"quote": text[:40], "speaker": "", "emotion": "neutral"}
        # 숫자 → stat_card
        elif re.search(r"\d+%|\d+배|\d+위", text):
            data = {"value": re.search(r"(\d+[%배위])", text).group(1), "label": text[:20], "sub": "", "icon": "chart", "trend": "up"}
            vt = "stat_card"
        # 첫 씬
        elif i == 0:
            vt = "full_visual"
            data = {"mood": "warm", "scene_desc": text[:40], "overlay_text": ""}
        # 마지막 씬
        elif i == len(scenes) - 1:
            vt = "key_point"
            data = {"text": text[:30], "sub": ""}
        else:
            vt = "key_point"
            data = {"text": text[:30], "sub": ""}

        result.append({"index": i, "visual_type": vt, "data": data})
    return result


BG_GROUP_PROMPT = """당신은 영상 배경 디자인 전문가입니다.
주어진 시나리오를 분석하여 3~6개의 배경 이미지 그룹으로 분류하세요.

## 규칙
- 20개 씬을 **분위기/장소/감정** 기준으로 3~6개 그룹으로 묶으세요.
- 각 그룹에 영문 이미지 생성 프롬프트를 작성하세요 (Google Flow / Grok 용).
- 프롬프트는 배경 풍경만 (인물 없이), 16:9 비율, 텍스트 없음.
- 한 그룹에 최소 2개 씬이 포함되어야 합니다.

## 출력 형식 (JSON만 출력, 다른 텍스트 없이):

```json
{
  "groups": [
    {
      "id": "bg_1",
      "label": "따뜻한 가족 식탁",
      "prompt": "Warm family dining room, soft golden hour light through window, cozy atmosphere, 16:9, no people, no text",
      "scene_indices": [0, 1, 2]
    },
    {
      "id": "bg_2",
      "label": "정보 전달 배경",
      "prompt": "Clean modern minimal background, soft gradient, subtle medical/health icons, 16:9, no text",
      "scene_indices": [3, 4, 5, 6, 7, 8]
    }
  ]
}
```"""


def generate_bg_groups(scenes: list[dict], style_label: str = "") -> dict:
    """
    시나리오 씬 → 3~6개 배경 그룹 + 씬별 매핑 + 이미지 프롬프트.

    Returns:
        {
            "groups": [{"id": "bg_1", "label": "...", "prompt": "...", "scene_indices": [0,1,2]}, ...],
            "scene_to_bg": {0: "bg_1", 1: "bg_1", ...}
        }
    """
    from google import genai

    api_key = os.environ.get("GOOGLE_API_KEY", "")
    if not api_key:
        return _bg_fallback(scenes)

    scene_text = "\n".join(f"[씬{s['index']+1}] {s['text']}" for s in scenes)
    user_prompt = f"화풍: {style_label}\n\n시나리오 ({len(scenes)}개 씬):\n{scene_text}"

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[{"role": "user", "parts": [{"text": BG_GROUP_PROMPT + "\n\n" + user_prompt}]}],
        )

        raw = response.text.strip()
        if "```" in raw:
            raw = raw.split("```json")[-1].split("```")[0].strip()
            if not raw:
                raw = response.text.split("```")[-2].strip()

        result = json.loads(raw)
        groups = result.get("groups", [])

        # scene_to_bg 매핑 생성
        scene_to_bg = {}
        for g in groups:
            for idx in g.get("scene_indices", []):
                scene_to_bg[idx] = g["id"]

        # 매핑 안 된 씬은 첫 번째 그룹에 할당
        if groups:
            for s in scenes:
                if s["index"] not in scene_to_bg:
                    scene_to_bg[s["index"]] = groups[0]["id"]

        print(f"[BgGroup] {len(groups)}개 배경 그룹 생성 완료", flush=True)
        return {"groups": groups, "scene_to_bg": scene_to_bg}

    except Exception as e:
        print(f"[BgGroup] Gemini 오류: {e} → 기본값", flush=True)
        return _bg_fallback(scenes)


def _bg_fallback(scenes: list[dict]) -> dict:
    """기본 배경 그룹 (3개)."""
    n = len(scenes)
    third = max(n // 3, 1)
    groups = [
        {"id": "bg_1", "label": "도입부", "prompt": "Warm emotional atmosphere, soft lighting, 16:9, no people, no text", "scene_indices": list(range(0, third))},
        {"id": "bg_2", "label": "본론", "prompt": "Clean informative background, subtle gradient, 16:9, no people, no text", "scene_indices": list(range(third, third * 2))},
        {"id": "bg_3", "label": "마무리", "prompt": "Hopeful bright atmosphere, golden light, 16:9, no people, no text", "scene_indices": list(range(third * 2, n))},
    ]
    scene_to_bg = {}
    for g in groups:
        for idx in g["scene_indices"]:
            scene_to_bg[idx] = g["id"]
    return {"groups": groups, "scene_to_bg": scene_to_bg}


if __name__ == "__main__":
    test_scenes = [
        {"index": 0, "text": "칠순 잔치 날, 아버지께서 젓가락질도 힘겨워하셨습니다."},
        {"index": 1, "text": "평생 가족을 위해 헌신하신 아버지. 이제는 기운이 없어 보이셨습니다."},
        {"index": 2, "text": "'내가 뭘 해도 되겠어?' 아버지의 깊은 한숨 소리에 제 마음도 무거워졌습니다."},
        {"index": 3, "text": "그러던 중, 우연히 '멀티비타민'에 대한 기사를 보게 되었습니다."},
        {"index": 4, "text": "60대 이상 시니어의 40%가 비타민D 부족이라는 통계가 있었습니다."},
    ]

    print("=== 비주얼타입 ===")
    vt = generate_visual_types(test_scenes, "지브리 실사풍")
    print(json.dumps(vt, ensure_ascii=False, indent=2))

    print("\n=== 배경 그룹 ===")
    bg = generate_bg_groups(test_scenes, "지브리 실사풍")
    print(json.dumps(bg, ensure_ascii=False, indent=2))
