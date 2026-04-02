#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
비주얼 강조 자동 감지기 (regex 폴백 전용 — Gemini 미사용 시)
=============================================================
씬 텍스트에서 패턴을 감지해 Remotion overlay 데이터를 생성.

우선순위 (개정):
  1순위: key_point         — 반전·강조 문장 (서사 구조 우선)
  2순위: contrast_statement — 알고보니/사실은/놀랍게도
  3순위: flow              — 단계/순서 구조
  4순위: list              — 첫째/둘째/셋째 열거
  5순위: bar               — 명시적 수치 비교
  6순위: num               — 단독 통계 (숫자가 핵심일 때만)

원칙:
- 강조할 내용이 없으면 None 반환 (모든 씬에 출현 불필요)
- 하나의 씬에서 가장 강한 패턴 하나만 선택
- 숫자가 있어도 씬의 핵심 메시지가 숫자 자체가 아니면 num 선택 안 함

반환 형식:
    None
    {"type": "key_point",          "text": "...", "emphasis": "...", "hint": "..."}
    {"type": "contrast_statement", "before": "...", "after": "...", "hint": "..."}
    {"type": "flow",  "steps": [...], "hint": "..."}
    {"type": "list",  "items": [...], "hint": "..."}
    {"type": "bar",   "left": {"label":"A","value":"X"}, "right": {...}, "hint": "..."}
    {"type": "num",   "value": "73%", "label": "...", "hint": "..."}
"""
from __future__ import annotations

import re
from typing import Optional


# ── CTA / 인사 씬 스킵 패턴 ──────────────────────────────────────────────────
_SKIP_PATTERNS = [
    re.compile(r"댓글|구독|좋아요|알림|공유"),
    re.compile(r"오늘\s*이야기|오늘은\s*함께|안녕하"),
]

# ── 반전·강조 문장 패턴 (key_point / contrast_statement 트리거) ───────────────
_REVERSAL_KEYWORDS = re.compile(
    r"사실은|알고\s*보니|놀랍게도|반대로|의외로|실제로는|오히려|"
    r"하지만\s*사실|그런데\s*사실|충격적|반전|착각|오해"
)

# 강조 단독 문장 패턴 — 짧고 임팩트 있는 문장
_KEY_POINT_PATTERNS = [
    re.compile(r"[가-힣\s]{8,30}[이가]\s*(?:바뀝|달라집|결정합|만듭|좌우합)"),   # "~이 바뀝니다"
    re.compile(r"(?:지금|오늘)\s*[가-힣\s]{4,20}(?:시작|선택|결정)"),             # "지금 선택이"
    re.compile(r"[가-힣\s]{4,15}\s*(?:하나면|하나로)\s*충분"),                     # "~하나면 충분"
    re.compile(r"(?:핵심은|중요한\s*것은|답은)\s*[가-힣\s]{3,20}"),               # "핵심은 ~"
]

# ── 반전 페어 추출 (before / after) ──────────────────────────────────────────
_CONTRAST_SPLIT = re.compile(
    r"(.{4,30}?)(?:사실은|알고\s*보니|놀랍게도|실제로는|반대로|하지만|오히려)\s*(.{4,40})"
)

# ── 비교 패턴 ─────────────────────────────────────────────────────────────────
_COMPARE_PATTERN = re.compile(
    r"([가-힣a-zA-Z\s]{1,10})\s*(\d+\.?\d*\s*%?)\s*[,\s]*"
    r"(?:vs\.?|VS|대비|보다|이고|이며|이나|반면|비해)\s*"
    r"([가-힣a-zA-Z\s]{1,10})\s*(\d+\.?\d*\s*%?)"
)
_TWO_NUMBERS = re.compile(r"(\d+\.?\d*)\s*(%|배|명|개)")

# ── 숫자 패턴 ────────────────────────────────────────────────────────────────
_KO_LARGE_NUM = re.compile(
    r"(\d+)\s*(조|억|만)\s*(개|명|원|건|마리|가지|곳|개소|달러|달라)?"
)
_NUM_PATTERN = re.compile(
    r"(\d+\.?\d*)\s*"
    r"(%|퍼센트|배|명|개|원|만원|억원|천만원|kg|g|mg|kcal|ml|L|cm|mm|mmHg|IU|mcg|번|회|개월|주|일|시간|분)"
)

# 숫자가 "핵심 메시지"임을 나타내는 강화 패턴
_NUM_IS_POINT = re.compile(
    r"무려|놀랍게도|충격적으로|불과|겨우|무려\s*\d|자그마치|\d+%\s*(?:나|나\s*됩|에\s*달|를\s*넘)"
)

# ── 순서/단계 패턴 ────────────────────────────────────────────────────────────
_FLOW_PATTERNS = [
    re.compile(r"[①②③④⑤]"),
    re.compile(r"첫\s*번\s*째.{1,20}둘\s*째"),
    re.compile(r"(?:1단계|2단계|3단계|step\s*1|step\s*2)", re.I),
    re.compile(r"(?:먼저|그\s*다음|마지막으로).{1,30}(?:먼저|그\s*다음|마지막으로|끝)", re.S),
]

# ── 열거 패턴 ────────────────────────────────────────────────────────────────
_LIST_PATTERNS = [
    re.compile(r"첫\s*째.{2,30}둘\s*째.{2,30}셋\s*째", re.S),
    re.compile(r"[①②③].{2,20}[②③④]", re.S),
    re.compile(r"(?:첫\s*번\s*째|두\s*번\s*째|세\s*번\s*째).{2,30}(?:두\s*번\s*째|세\s*번\s*째)", re.S),
]


# ── 메인 감지 함수 ────────────────────────────────────────────────────────────

def detect(text: str) -> Optional[dict]:
    """씬 텍스트에서 강조 요소 자동 감지 (regex 폴백 전용)."""
    for pat in _SKIP_PATTERNS:
        if pat.search(text):
            return None

    # 1순위: 반전·강조 문장 — contrast_statement
    contrast = _detect_contrast(text)
    if contrast:
        return contrast

    # 2순위: 핵심 강조 문장 — key_point
    kp = _detect_key_point(text)
    if kp:
        return kp

    # 3순위: 흐름 구조 — flow
    flow = _detect_flow(text)
    if flow:
        return flow

    # 4순위: 열거 구조 — list
    lst = _detect_list(text)
    if lst:
        return lst

    # 5순위: 명시적 수치 비교 — bar
    bar = _detect_bar(text)
    if bar:
        return bar

    # 6순위: 단독 통계 — num (숫자가 메시지의 핵심일 때만)
    num = _detect_num(text)
    if num:
        return num

    return None


# ── 내부 감지 함수 ────────────────────────────────────────────────────────────

def _detect_contrast(text: str) -> Optional[dict]:
    """알고보니/사실은/놀랍게도 등 반전 서사 감지."""
    if not _REVERSAL_KEYWORDS.search(text):
        return None

    m = _CONTRAST_SPLIT.search(text)
    keyword_m = _REVERSAL_KEYWORDS.search(text)
    hint = text[keyword_m.start():keyword_m.start() + 12].strip() if keyword_m else "사실은"

    if m:
        before = m.group(1).strip()[:30]
        after  = m.group(2).strip()[:40]
    else:
        # 키워드 앞뒤로 분리
        idx = keyword_m.start() if keyword_m else len(text) // 2
        before = text[:idx].strip()[-30:]
        after  = text[idx:].strip()[:40]

    if not before or not after:
        return None

    return {
        "type":   "contrast_statement",
        "before": before,
        "after":  after,
        "hint":   hint,
    }


def _detect_key_point(text: str) -> Optional[dict]:
    """임팩트 있는 핵심 강조 문장 감지."""
    for pat in _KEY_POINT_PATTERNS:
        m = pat.search(text)
        if m:
            matched = m.group(0).strip()[:40]
            # emphasis: 가장 의미 있는 명사구 (마지막 2~4글자 동사 전 명사)
            nouns = re.findall(r"[가-힣]{2,6}", matched)
            emphasis = nouns[-2] if len(nouns) >= 2 else (nouns[0] if nouns else "")
            return {
                "type":     "key_point",
                "text":     matched,
                "emphasis": emphasis,
                "hint":     matched[:12],
            }
    return None


def _detect_flow(text: str) -> Optional[dict]:
    """단계/순서 흐름 추출."""
    for pat in _FLOW_PATTERNS:
        if pat.search(text):
            steps = _extract_steps(text)
            if len(steps) >= 2:
                hint_m = re.search(r"먼저|1단계|①", text)
                hint = text[hint_m.start():hint_m.start() + 8].strip() if hint_m else "단계"
                return {"type": "flow", "steps": steps, "hint": hint}
    return None


def _detect_list(text: str) -> Optional[dict]:
    """첫째/둘째/셋째 열거 추출."""
    for pat in _LIST_PATTERNS:
        if pat.search(text):
            items = _extract_list_items(text)
            if len(items) >= 2:
                hint_m = re.search(r"첫\s*째|첫\s*번\s*째|①", text)
                hint = text[hint_m.start():hint_m.start() + 8].strip() if hint_m else "첫째"
                return {"type": "list", "items": items, "hint": hint}
    return None


def _detect_bar(text: str) -> Optional[dict]:
    """명시적 수치 비교 감지."""
    m = _COMPARE_PATTERN.search(text)
    if m:
        return {
            "type":  "bar",
            "left":  {"label": m.group(1).strip(), "value": m.group(2).strip()},
            "right": {"label": m.group(3).strip(), "value": m.group(4).strip()},
            "hint":  m.group(0)[:12].strip(),
        }

    if re.search(r"비해|대비|보다\s*(?:\d)", text):
        nums = _TWO_NUMBERS.findall(text)
        if len(nums) >= 2:
            labels = _extract_labels_for_two(text, nums)
            return {
                "type":  "bar",
                "left":  {"label": labels[0], "value": nums[0][0] + nums[0][1]},
                "right": {"label": labels[1], "value": nums[1][0] + nums[1][1]},
                "hint":  (nums[0][0] + nums[0][1])[:12],
            }
    return None


def _detect_num(text: str) -> Optional[dict]:
    """단독 통계 수치 감지 — 숫자가 씬 메시지의 핵심일 때만."""
    # 숫자가 핵심 메시지임을 나타내는 강화 패턴이 있어야만 num 선택
    is_core = bool(_NUM_IS_POINT.search(text))

    # 1순위: 한국어 대단위 복합 숫자
    large_matches = _KO_LARGE_NUM.findall(text)
    if large_matches:
        _WEIGHT = {"조": 1_000_000_000_000, "억": 100_000_000, "만": 10_000}
        best = max(large_matches, key=lambda m: int(m[0]) * _WEIGHT.get(m[1], 1))
        digits, multiplier, unit = best
        value_str = digits + multiplier + (unit if unit else "")
        label = _extract_label_near_num(text, digits, multiplier)
        # 강화 패턴 없으면 억/조 단위만 허용 (만 단위는 강화 패턴 필수)
        if is_core or _WEIGHT.get(multiplier, 0) >= 100_000_000:
            return {"type": "num", "value": value_str, "label": label, "hint": value_str}

    matches = _NUM_PATTERN.findall(text)
    if not matches:
        return None
    matches = [(v, u) for v, u in matches if not (1900 <= float(v) <= 2099)]
    if not matches:
        return None

    percent_matches = [(v, u) for v, u in matches if u in ("%", "퍼센트")]
    chosen = percent_matches[0] if percent_matches else matches[0]

    try:
        if float(chosen[0]) < 3 and chosen[1] not in ("%", "퍼센트", "배"):
            return None
    except ValueError:
        pass

    # % 수치는 강화 패턴 없어도 허용 (% 자체가 강조값)
    # 일반 단위는 강화 패턴 필수
    if chosen[1] not in ("%", "퍼센트") and not is_core:
        return None

    value_str = chosen[0] + chosen[1]
    label = _extract_label_near_num(text, chosen[0], chosen[1])
    return {"type": "num", "value": value_str, "label": label, "hint": value_str}


# ── 텍스트 추출 헬퍼 ──────────────────────────────────────────────────────────

def _extract_label_near_num(text: str, value: str, unit: str) -> str:
    pattern = re.compile(r"([가-힣a-zA-Z\s]{2,12})\s+" + re.escape(value) + re.escape(unit))
    m = pattern.search(text)
    if m:
        label = re.sub(r"[은는이가을를의에서도로]$", "", m.group(1).strip()).strip()
        if len(label) >= 2:
            return label[:12]
    pattern2 = re.compile(re.escape(value) + re.escape(unit) + r"\s*([가-힣]{2,10})")
    m2 = pattern2.search(text)
    if m2:
        return m2.group(1).strip()[:12]
    return ""


def _extract_labels_for_two(text: str, nums: list) -> list[str]:
    labels = []
    for value, unit in nums[:2]:
        pat = re.compile(r"([가-힣a-zA-Z]{2,8})\s*" + re.escape(value))
        m = pat.search(text)
        labels.append(m.group(1).strip()[:8] if m else ("A" if not labels else "B"))
    return labels


def _extract_steps(text: str) -> list[str]:
    steps = []
    step_markers = re.split(r"먼저|그\s*다음|다음으로|이후|마지막으로|끝으로", text)
    if len(step_markers) >= 2:
        for part in step_markers[1:4]:
            clean = part.strip().split(".")[0].strip()
            clean = re.sub(r"[,，。]", "", clean)[:20]
            if clean:
                steps.append(clean)
        if steps:
            return steps

    stage_matches = re.findall(r"\d+단계\s*[：:·]?\s*([가-힣\s]{2,15})", text)
    if stage_matches:
        return [s.strip()[:20] for s in stage_matches[:4]]

    circle_matches = re.findall(r"[①②③④⑤]\s*([가-힣\s]{2,15})", text)
    if circle_matches:
        return [s.strip()[:20] for s in circle_matches[:4]]

    return steps


def _extract_list_items(text: str) -> list[str]:
    parts = re.split(r"첫\s*째|둘\s*째|셋\s*째|넷\s*째|첫\s*번\s*째|두\s*번\s*째|세\s*번\s*째", text)
    items = []
    for part in parts[1:4]:
        clean = part.strip().split(".")[0].strip()
        clean = re.sub(r"[,，。]", "", clean)[:20]
        if clean:
            items.append(clean)
    if items:
        return items

    circle_parts = re.split(r"[①②③④⑤]", text)
    items2 = []
    for part in circle_parts[1:4]:
        clean = part.strip().split(".")[0].strip()[:20]
        if clean:
            items2.append(clean)
    return items2


# ── 배치 처리 ─────────────────────────────────────────────────────────────────

def detect_all(scenes: list[dict]) -> list[dict]:
    result = []
    for scene in scenes:
        accent = detect(scene.get("text", ""))
        result.append({**scene, "visual_accent": accent})
    return result


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json, sys

    if len(sys.argv) < 2:
        samples = [
            "사실 우리가 알던 것과 반대입니다. 알고 보니 규칙적인 소식이 오히려 근육량을 줄입니다.",
            "지금 당신의 선택 하나가 10년 후를 완전히 바꿀 수 있습니다.",
            "달걀 vs 두부, 단백질 흡수율은 달걀 91%에 비해 두부는 78%입니다.",
            "첫째 아침 산책, 둘째 비타민 복용, 셋째 충분한 수면입니다.",
            "먼저 스트레칭을 합니다. 그 다음 가벼운 걷기를 시작합니다. 마지막으로 심호흡으로 마무리합니다.",
            "무려 49만 개의 사업장이 폐업했습니다.",
            "오늘 영상 어떠셨나요? 댓글로 알려주세요. 구독과 좋아요 부탁드립니다.",
        ]
        for s in samples:
            result = detect(s)
            print(f"텍스트: {s[:50]}...")
            print(f"감지:   {json.dumps(result, ensure_ascii=False)}\n")
    else:
        text = " ".join(sys.argv[1:])
        result = detect(text)
        print(json.dumps(result, ensure_ascii=False, indent=2))
