#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
비주얼 강조 자동 감지기
========================
씬 텍스트에서 패턴을 감지해 Remotion overlay 데이터를 생성.

원칙:
- 강조할 내용이 없으면 None 반환 (모든 씬에 출현 불필요)
- 하나의 씬에서 가장 강한 패턴 하나만 선택
- 데이터 추출은 최소한으로 — Remotion에서 표시할 핵심 값만

반환 형식:
    None                              — 강조 없음
    {"type": "num",  "value": "73%",  "label": "60대 비타민D 부족"}
    {"type": "bar",  "left": {"label":"A", "value":"30%"}, "right": {"label":"B", "value":"70%"}}
    {"type": "flow", "steps": ["1단계", "2단계", "3단계"]}
    {"type": "list", "items": ["항목1", "항목2", "항목3"]}
"""
from __future__ import annotations

import re
from typing import Optional


# ── 숫자 단위 패턴 ────────────────────────────────────────────────────────────
# 수치가 포함된 씬에서 가장 임팩트 있는 숫자 추출

# 1순위: 한국어 대단위 복합 숫자 (49만 개, 3억 명 등)
_KO_LARGE_NUM = re.compile(
    r"(\d+)\s*(조|억|만)\s*(개|명|원|건|마리|가지|곳|곳|개소|달러|달라)?"
)

_NUM_PATTERN = re.compile(
    r"(\d+\.?\d*)\s*"
    r"(%|퍼센트|배|명|개|원|만원|억원|천만원|kg|g|mg|kcal|ml|L|cm|mm|mmHg|IU|mcg|번|회|개월|주|일|시간|분)"
)

# 비교 패턴 (두 수치가 같은 문장에)
_COMPARE_PATTERN = re.compile(
    r"([가-힣a-zA-Z\s]{1,10})\s*(\d+\.?\d*\s*%?)\s*[,\s]*"
    r"(?:vs\.?|VS|대비|보다|이고|이며|이나|반면|비해)\s*"
    r"([가-힣a-zA-Z\s]{1,10})\s*(\d+\.?\d*\s*%?)"
)

# 두 수치 단순 병렬 (같은 씬에서 A XX% / B YY% 패턴)
_TWO_NUMBERS = re.compile(r"(\d+\.?\d*)\s*(%|배|명|개)")

# 순서/단계 패턴
_FLOW_PATTERNS = [
    re.compile(r"[①②③④⑤]"),                                         # 원문자
    re.compile(r"첫\s*번\s*째.{1,20}둘\s*째"),                         # 첫째 둘째
    re.compile(r"(?:1단계|2단계|3단계|step\s*1|step\s*2)", re.I),      # 단계 명시
    re.compile(r"(?:먼저|그\s*다음|마지막으로).{1,30}(?:먼저|그\s*다음|마지막으로|끝)", re.S),
]

# 열거 패턴 (첫째/둘째/셋째 or ①②③)
_LIST_PATTERNS = [
    re.compile(r"첫\s*째.{2,30}둘\s*째.{2,30}셋\s*째", re.S),
    re.compile(r"[①②③].{2,20}[②③④]", re.S),
    re.compile(r"(?:첫\s*번\s*째|두\s*번\s*째|세\s*번\s*째).{2,30}(?:두\s*번\s*째|세\s*번\s*째)", re.S),
]

# 강조 불필요 패턴 (오프닝/클로징 씬)
_SKIP_PATTERNS = [
    re.compile(r"댓글|구독|좋아요|알림|공유"),         # CTA 씬
    re.compile(r"오늘\s*이야기|오늘은\s*함께|안녕하"),   # 인사 씬
]


def detect(text: str) -> Optional[dict]:
    """
    씬 텍스트에서 강조 요소 자동 감지.

    Args:
        text: 씬 나레이션 텍스트

    Returns:
        강조 데이터 dict 또는 None
    """
    # 강조 불필요 씬 (CTA, 오프닝 인사) → 즉시 None
    for pat in _SKIP_PATTERNS:
        if pat.search(text):
            return None

    # 1순위: 비교 (bar) — A vs B 명시적 비교
    bar = _detect_bar(text)
    if bar:
        return bar

    # 2순위: 수치 (num) — 임팩트 있는 숫자 하나
    num = _detect_num(text)
    if num:
        return num

    # 3순위: 흐름 (flow) — 단계/순서
    flow = _detect_flow(text)
    if flow:
        return flow

    # 4순위: 열거 (list) — 첫째/둘째/셋째
    lst = _detect_list(text)
    if lst:
        return lst

    return None


# ── 내부 감지 함수 ────────────────────────────────────────────────────────────

def _detect_bar(text: str) -> Optional[dict]:
    """A vs B 비교 — 두 수치 추출."""
    m = _COMPARE_PATTERN.search(text)
    if m:
        return {
            "type": "bar",
            "left":  {"label": m.group(1).strip(), "value": m.group(2).strip()},
            "right": {"label": m.group(3).strip(), "value": m.group(4).strip()},
        }

    # 명시적 vs 없어도 같은 문장에 두 수치 + 비교 키워드
    if re.search(r"비해|대비|보다\s*(?:\d)", text):
        nums = _TWO_NUMBERS.findall(text)
        if len(nums) >= 2:
            # 문장에서 첫 번째 수치 앞 명사 추출
            labels = _extract_labels_for_two(text, nums)
            return {
                "type": "bar",
                "left":  {"label": labels[0], "value": nums[0][0] + nums[0][1]},
                "right": {"label": labels[1], "value": nums[1][0] + nums[1][1]},
            }

    return None


def _detect_num(text: str) -> Optional[dict]:
    """가장 임팩트 있는 숫자 하나 추출."""

    # 1순위: 한국어 대단위 복합 숫자 (49만 개, 3억 명 등) — 연도보다 우선
    large_matches = _KO_LARGE_NUM.findall(text)
    # large_matches: [(digits, multiplier, unit), ...]
    if large_matches:
        # 가장 큰 값 선택 (multiplier 기준 조 > 억 > 만)
        _WEIGHT = {"조": 1_000_000_000_000, "억": 100_000_000, "만": 10_000}
        best = max(large_matches, key=lambda m: int(m[0]) * _WEIGHT.get(m[1], 1))
        digits, multiplier, unit = best
        value_str = digits + multiplier + (unit if unit else "")
        # 복합 숫자 뒤 명사(주어/목적어)를 label로 추출
        # 예: "49만 개의 사업장이 폐업" → "사업장 폐업"
        full_pat = re.compile(
            re.escape(digits) + r"\s*" + re.escape(multiplier) +
            (r"\s*" + re.escape(unit) if unit else "") +
            r"[의가이은는을를\s]*([가-힣]{2,6})"
        )
        m_after = full_pat.search(text)
        # 동사(폐업, 감소, 증가 등)도 추출해서 합산
        verb_pat = re.compile(
            re.escape(digits) + r"\s*" + re.escape(multiplier) +
            r".{0,15}([가-힣]{2,4}(?:업|감|증|락|등|건|폐|개))(?:[을를이가]|$)"
        )
        mv = verb_pat.search(text)
        def _strip_josa(s: str) -> str:
            return re.sub(r"[이가을를은는의도에서]$", "", s).strip()

        if m_after and mv and m_after.group(1) != mv.group(1):
            label = _strip_josa(m_after.group(1)) + " " + _strip_josa(mv.group(1))
        elif m_after:
            label = _strip_josa(m_after.group(1))
        else:
            label = _extract_label_near_num(text, digits, multiplier)
        return {"type": "num", "value": value_str, "label": label}

    matches = _NUM_PATTERN.findall(text)
    if not matches:
        return None

    # 연도(1900-2099 + 년) 제외
    matches = [
        (v, u) for v, u in matches
        if not (u == "년" and 1900 <= float(v) <= 2099)
    ]
    if not matches:
        return None

    # % 우선, 그 다음 큰 숫자 순
    percent_matches = [(v, u) for v, u in matches if u == "%" or u == "퍼센트"]
    chosen = percent_matches[0] if percent_matches else matches[0]

    value_str = chosen[0] + chosen[1]
    label = _extract_label_near_num(text, chosen[0], chosen[1])

    # 너무 작은 숫자는 강조 불필요 (예: "2개", "1번")
    try:
        if float(chosen[0]) < 3 and chosen[1] not in ("%", "퍼센트", "배", "배수"):
            return None
    except ValueError:
        pass

    return {
        "type": "num",
        "value": value_str,
        "label": label,
    }


def _detect_flow(text: str) -> Optional[dict]:
    """단계/순서 흐름 추출."""
    for pat in _FLOW_PATTERNS:
        if pat.search(text):
            steps = _extract_steps(text)
            if len(steps) >= 2:
                return {"type": "flow", "steps": steps}
    return None


def _detect_list(text: str) -> Optional[dict]:
    """첫째/둘째/셋째 열거 추출."""
    for pat in _LIST_PATTERNS:
        if pat.search(text):
            items = _extract_list_items(text)
            if len(items) >= 2:
                return {"type": "list", "items": items}
    return None


# ── 텍스트 추출 헬퍼 ──────────────────────────────────────────────────────────

def _extract_label_near_num(text: str, value: str, unit: str) -> str:
    """숫자 앞 명사구 추출 (최대 10자)."""
    pattern = re.compile(
        r"([가-힣a-zA-Z\s]{2,12})\s+" + re.escape(value) + re.escape(unit)
    )
    m = pattern.search(text)
    if m:
        label = m.group(1).strip()
        # 조사/접속사 제거
        label = re.sub(r"[은는이가을를의에서도로]$", "", label).strip()
        if len(label) >= 2:
            return label[:12]

    # 숫자 뒤 동사구 추출 (폴백)
    pattern2 = re.compile(
        re.escape(value) + re.escape(unit) + r"\s*([가-힣]{2,10})"
    )
    m2 = pattern2.search(text)
    if m2:
        return m2.group(1).strip()[:12]

    return ""


def _extract_labels_for_two(text: str, nums: list) -> list[str]:
    """두 수치 각각의 레이블 추출 (폴백: A, B)."""
    labels = []
    for value, unit in nums[:2]:
        pat = re.compile(r"([가-힣a-zA-Z]{2,8})\s*" + re.escape(value))
        m = pat.search(text)
        if m:
            labels.append(m.group(1).strip()[:8])
        else:
            labels.append("A" if not labels else "B")
    return labels


def _extract_steps(text: str) -> list[str]:
    """단계 텍스트 추출."""
    steps = []

    # "먼저 ~, 그 다음 ~, 마지막으로 ~" 패턴
    step_markers = re.split(r"먼저|그\s*다음|다음으로|이후|마지막으로|끝으로", text)
    if len(step_markers) >= 2:
        for part in step_markers[1:4]:
            clean = part.strip().split(".")[0].strip()
            clean = re.sub(r"[,，。]", "", clean)[:20]
            if clean:
                steps.append(clean)
        if steps:
            return steps

    # 1단계/2단계 패턴
    stage_matches = re.findall(r"\d+단계\s*[：:·]?\s*([가-힣\s]{2,15})", text)
    if stage_matches:
        return [s.strip()[:20] for s in stage_matches[:4]]

    # ①②③ 패턴
    circle_matches = re.findall(r"[①②③④⑤]\s*([가-힣\s]{2,15})", text)
    if circle_matches:
        return [s.strip()[:20] for s in circle_matches[:4]]

    return steps


def _extract_list_items(text: str) -> list[str]:
    """첫째/둘째/셋째 항목 추출."""
    # 첫째/둘째/셋째 분리
    parts = re.split(r"첫\s*째|둘\s*째|셋\s*째|넷\s*째|첫\s*번\s*째|두\s*번\s*째|세\s*번\s*째", text)
    items = []
    for part in parts[1:4]:
        clean = part.strip().split(".")[0].strip()
        clean = re.sub(r"[,，。]", "", clean)[:20]
        if clean:
            items.append(clean)

    if items:
        return items

    # ①②③ 항목
    circle_parts = re.split(r"[①②③④⑤]", text)
    items2 = []
    for part in circle_parts[1:4]:
        clean = part.strip().split(".")[0].strip()[:20]
        if clean:
            items2.append(clean)
    return items2


# ── 배치 처리 ─────────────────────────────────────────────────────────────────

def detect_all(scenes: list[dict]) -> list[dict]:
    """
    씬 리스트 전체에 visual_accent 자동 감지 적용.

    Args:
        scenes: [{"index": N, "text": "...", ...}, ...]

    Returns:
        visual_accent 필드가 채워진 씬 리스트
    """
    result = []
    for scene in scenes:
        accent = detect(scene.get("text", ""))
        result.append({**scene, "visual_accent": accent})
    return result


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json, sys

    if len(sys.argv) < 2:
        # 테스트 예시
        samples = [
            "달걀 하나에 단백질 6.3g. 60대 하루 권장량의 12%를 한 번에 채웁니다.",
            "국내 60대 중 68%가 이 사실을 모릅니다. 놀랍지 않으신가요?",
            "달걀 vs 두부, 단백질 흡수율은 달걀 91%에 비해 두부는 78%입니다.",
            "첫째 아침 산책, 둘째 비타민 복용, 셋째 충분한 수면입니다.",
            "먼저 스트레칭을 합니다. 그 다음 가벼운 걷기를 시작합니다. 마지막으로 심호흡으로 마무리합니다.",
            "오늘 영상 어떠셨나요? 댓글로 알려주세요. 구독과 좋아요 부탁드립니다.",
        ]
        for s in samples:
            result = detect(s)
            print(f"텍스트: {s[:40]}...")
            print(f"감지:   {json.dumps(result, ensure_ascii=False)}\n")
    else:
        text = " ".join(sys.argv[1:])
        result = detect(text)
        print(json.dumps(result, ensure_ascii=False, indent=2))
