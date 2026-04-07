"""
series_generate.py — 시리즈 세계관/대본 생성 라우터
트랜드 키워드 → 웹소설 제목/주제/등장인물/개요를 Gemini로 생성
STEP 2: NLM 팩트 주입 → Gemini 대본 스트리밍 생성
"""
from __future__ import annotations

import asyncio
import json
import os
import re
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.nlm_fact_service import query_chapter_facts, normalize_role

# FastAPI 실행 위치 무관하게 루트 .env 로드
load_dotenv(Path(__file__).parent.parent.parent.parent / ".env")

router = APIRouter(prefix="/api/v1/series", tags=["Series"])


# ── 요청/응답 모델 ─────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    topic: str
    api_key: str = ""


class CharacterOption(BaseModel):
    label: str
    sub: str


class GenerateResponse(BaseModel):
    titles: list[str]
    subjects: list[str]
    charA: list[CharacterOption]
    charB: list[CharacterOption]


class OutlineRequest(BaseModel):
    topic: str
    title: str
    subject: str
    api_key: str = ""


class OutlineResponse(BaseModel):
    outline: str


# ── Gemini 호출 헬퍼 ──────────────────────────────────────────────────────────

def _get_api_key(req_key: str) -> str:
    key = req_key.strip() or os.environ.get("GOOGLE_API_KEY", "")
    if not key:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY 미설정")
    return key


def _call_gemini(
    api_key: str,
    prompt: str,
    max_tokens: int = 2048,
    temperature: float = 0.9,
    thinking: bool = False,
    timeout: int = 120,
    retries: int = 3,
) -> str:
    import time
    from google import genai
    client = genai.Client(api_key=api_key)
    cfg: dict = {"temperature": temperature, "max_output_tokens": max_tokens}
    if not thinking:
        cfg["thinking_config"] = {"thinking_budget": 0}

    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=cfg,
            )
            text = response.text
            if not text:
                raise HTTPException(status_code=500, detail="Gemini 응답 없음 — Safety filter 차단 가능성")
            return text
        except HTTPException:
            raise
        except Exception as e:
            last_err = e
            if attempt < retries - 1:
                time.sleep(3 * (attempt + 1))  # 3초, 6초 대기 후 재시도
    raise HTTPException(status_code=500, detail=f"Gemini 호출 실패 ({retries}회 시도): {last_err}")


def _extract_json(raw: str) -> dict:
    """응답에서 JSON 블록 추출 및 파싱 (마크다운 코드블록 자동 제거 + json_repair 폴백)"""
    # ```json ... ``` 또는 ``` ... ``` 블록 내부 추출
    code_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw)
    if code_match:
        raw = code_match.group(1).strip()
    match = re.search(r'\{[\s\S]*\}', raw)
    if not match:
        raise HTTPException(status_code=500, detail=f"JSON 파싱 실패 — raw: {raw[:300]}")
    json_str = match.group(0)
    # 1차: 정상 파싱
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        pass
    # 2차: json_repair 자동 복구 (따옴표·제어문자 등 경미한 오류 처리)
    try:
        from json_repair import repair_json
        repaired = repair_json(json_str, return_objects=True)
        if isinstance(repaired, dict):
            return repaired
    except Exception:
        pass
    raise HTTPException(status_code=500, detail=f"JSON 디코딩 실패 — raw: {raw[:300]}")


# ── 엔드포인트 ─────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=GenerateResponse)
def generate_world(req: GenerateRequest):
    """트랜드 키워드 → 웹소설 제목 3개 + 주제 3개 + 남녀 등장인물 각 4종 생성"""
    api_key = _get_api_key(req.api_key)

    prompt = f"""
당신은 한국 웹소설 기획 전문가입니다.
트랜드 키워드: "{req.topic}"

이 키워드를 소재로 한 한국 웹소설/드라마 시리즈를 기획해주세요.
아래 JSON 형식만 출력하세요. 설명, 마크다운, 코드블록 없이 순수 JSON만 출력합니다.

{{
  "titles": ["제목1", "제목2", "제목3"],
  "subjects": ["주제1", "주제2", "주제3"],
  "charA": [
    {{ "label": "직업/나이", "sub": "이 인물이 이야기에서 맡는 역할 한 줄" }},
    {{ "label": "직업/나이", "sub": "이 인물이 이야기에서 맡는 역할 한 줄" }},
    {{ "label": "직업/나이", "sub": "이 인물이 이야기에서 맡는 역할 한 줄" }},
    {{ "label": "직업/나이", "sub": "이 인물이 이야기에서 맡는 역할 한 줄" }}
  ],
  "charB": [
    {{ "label": "직업/나이", "sub": "이 인물이 이야기에서 맡는 역할 한 줄" }},
    {{ "label": "직업/나이", "sub": "이 인물이 이야기에서 맡는 역할 한 줄" }},
    {{ "label": "직업/나이", "sub": "이 인물이 이야기에서 맡는 역할 한 줄" }},
    {{ "label": "직업/나이", "sub": "이 인물이 이야기에서 맡는 역할 한 줄" }}
  ]
}}

조건:
- titles: 감성적이고 웹소설다운 제목 3개. 키워드를 직접 쓰지 말고 은유적으로 표현
- subjects: 이 시리즈가 다루는 사회적 메시지/갈등 3가지
- charA: 남성 등장인물 4가지 유형 (서로 다른 나이대/직업)
- charB: 여성 등장인물 4가지 유형 (서로 다른 나이대/직업)
- 모든 텍스트는 한국어
"""

    raw = _call_gemini(api_key, prompt, max_tokens=2048, temperature=0.9)
    data = _extract_json(raw)

    try:
        char_a = [CharacterOption(**c) for c in data.get("charA", [])]
        char_b = [CharacterOption(**c) for c in data.get("charB", [])]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"캐릭터 파싱 실패: {e}")

    return GenerateResponse(
        titles=data.get("titles", []),
        subjects=data.get("subjects", []),
        charA=char_a,
        charB=char_b,
    )


# ── STEP 2: NLM 팩트 주입 → 대본 스트리밍 ────────────────────────────────────


def _build_system_instruction() -> str:
    """
    단일 소스: apps/api/prompts/wiki_query.md 의 <!-- SYSTEM_INSTRUCTION --> 블록을 읽어 반환.
    원칙 수정은 wiki_query.md 한 곳에서만 하면 된다.
    """
    from pathlib import Path
    prompt_path = Path(__file__).parent.parent / "prompts" / "wiki_query.md"
    raw = prompt_path.read_text(encoding="utf-8")
    m = re.search(r"<!-- SYSTEM_INSTRUCTION -->([\s\S]+?)<!-- /SYSTEM_INSTRUCTION -->", raw)
    if m:
        return m.group(1).strip()
    # 파일 파싱 실패 시 안전 폴백 (빈 문자열보다 기본값 유지)
    raise RuntimeError(f"wiki_query.md에서 SYSTEM_INSTRUCTION 블록을 찾을 수 없습니다: {prompt_path}")


_CHAPTER_ROLE_GUIDE: dict[str, str] = {
    "도입부": """## 도입부 전용 비트 변형

### 챕터 1의 유일한 임무: 감정적 위기 하나에 집중
독자가 챕터 2를 누르는 이유는 사건 전모를 알아서가 아니라, 이 인물이 너무 불쌍하거나 억울해서다.
챕터 1에서 사건의 전모·원인·연결고리를 설명하지 말 것 — 독자는 몰라야 다음 화를 누른다.
공개할 것: 인물이 처한 감정적 위기 하나. 숨길 것: 그 위기의 원인과 전모.

### 비트 변형
- [비트1 강화] 첫 문장은 감각 디테일 또는 물리적 사실로 시작 — 인물 소개·상황 설명으로 시작 금지
  예: "통장 잔고는 23만 원이었다." / "문자가 왔다. '보증금 반환 불가.'"
- [비트2] 주인공 A 한 명에게만 집중 — 챕터 1에서 두 주인공을 모두 등장시키지 말 것. 한 명의 위기를 깊이 파고들어야 독자가 감정이입한다
- [비트3~4] 위기 사건 하나가 터지고 주인공이 무너지는 과정 — 원인을 설명하지 말고 반응만 보여줄 것
  금지: "아버지가 투자사기에 연루되어 경찰 조사를 받게 됐다" (사건 요약)
  허용: 전화를 끊은 뒤 수화기를 내려놓는 손이 떨리는 장면 (감정 반응)
- [비트5] 주인공 B의 존재를 마지막에 단 한 장면·한 문장으로만 암시 — 이름·직업·상황 설명 없이 존재감만 심을 것
- [비트6] 반전의 내용을 설명하지 말고 반전의 징후만 배치
  금지: "그녀의 남편이 집주인이라는 사실을 아직 몰랐다" (정답 공개)
  허용: "서류를 받아드는 순간, 그녀의 손끝이 미세하게 떨렸다" (독자가 추론)
- [비트7] 클로징 훅은 질문형 — 독자가 "이게 뭐지?"라고 생각하며 다음 화를 누르게 만드는 미완성 문장으로 끝낼 것
- 이 챕터에서 일어나는 사건만 쓸 것 — 챕터 2 이후 사건 금지""",

    "전개": """## 전개 챕터 전용 비트 변형
- [비트2] 앞 챕터 마지막 징후에서 이어받아 시작 — 앞 챕터 요약 서술 금지
- [비트4 강화] 갈등을 앞 챕터보다 한 단계 심화. 한 인물이 거짓말하거나 회피하는 순간 반드시 포함
- [비트5 강화] 내면 동요가 큰 인물의 행동을 3가지 이상 구체적으로 묘사
- [비트7] 다음 챕터 복선 1개만 슬쩍 남길 것 — 과잉 예고 금지""",

    "클라이맥스": """## 클라이맥스 챕터 전용 비트 변형
- [비트4 강화] 핵심 갈등이 이 챕터에서 폭발·충돌 — 회피 없이 정면 대결
- [비트6 강화] 반전 또는 고백 1개, 인물의 행동으로 드러낼 것 — 대사로 직접 설명 금지
- [비트7 강화] 감정 온도를 최고점으로 끌어올린 뒤 마지막 문장에서 급반전""",

    "결말": """## 결말 챕터 전용 비트 변형
- [비트6 전환] 핵심 갈등의 감정적 해소 — 열린 결말 또는 완결 선택
- [비트7 강화] 갈등 트리거(소재)가 여전히 해결되지 않았음을 1문장으로 녹여 여운 남기기. 속편 가능성 1줄 암시 허용, 노골적 예고 금지""",
}


def _get_role_guide(chapter_role: str) -> str:
    key = normalize_role(chapter_role, list(_CHAPTER_ROLE_GUIDE.keys()))
    return _CHAPTER_ROLE_GUIDE.get(key, _CHAPTER_ROLE_GUIDE["전개"])


def _build_inner_engine_section(
    world: dict,
    char_a_name: str,
    char_b_name: str,
    char_a_emotion_now: str,
    char_b_emotion_now: str,
) -> str:
    """캐릭터 내면 엔진 섹션 — Want/Need 축 + 챕터 감정 상태 + coreWound"""
    lines = ["## 인물 내면 엔진 (대사·행동의 근거 — 반드시 준수)"]
    has_data = False

    want_a = world.get("charAWant", "")
    need_a = world.get("charANeed", "")
    if want_a or need_a or char_a_emotion_now:
        has_data = True
        lines.append(f"\n### {char_a_name}")
        if want_a:
            lines.append(f"- 표면 욕망(Want): {want_a}")
        if need_a:
            lines.append(f"- 내면 결핍(Need): {need_a}")
        if char_a_emotion_now:
            lines.append(f"- 이번 챕터 감정 상태: {char_a_emotion_now}")

    want_b = world.get("charBWant", "")
    need_b = world.get("charBNeed", "")
    if want_b or need_b or char_b_emotion_now:
        has_data = True
        lines.append(f"\n### {char_b_name}")
        if want_b:
            lines.append(f"- 표면 욕망(Want): {want_b}")
        if need_b:
            lines.append(f"- 내면 결핍(Need): {need_b}")
        if char_b_emotion_now:
            lines.append(f"- 이번 챕터 감정 상태: {char_b_emotion_now}")

    core_wound = world.get("coreWound", "")
    if core_wound:
        has_data = True
        lines.append(f"\n### 두 인물의 감정 공명")
        lines.append(core_wound)

    if not has_data:
        return ""

    return "\n".join(lines)


def _build_script_prompt(world: dict, chapter: int, chapter_role: str, nlm_facts: str, prev_chapter_ending: str = "", wiki_context: str = "") -> str:
    """세계관 + 위키 컨텍스트(우선) / NLM 팩트(폴백) → 챕터 집중 대본 생성 User Message"""
    total_chapters = world.get("chapters") or 6

    # 감정선 — 챕터별 arc 상태로 주입
    # id → 이름 매핑
    _id_to_name: dict[str, str] = {}
    for role in ("charA", "charB"):
        cid = world.get(role, "")
        cname = world.get(f"{role}Name", "")
        if cid and cname:
            _id_to_name[cid] = cname

    emotion_lines_raw = world.get("emotionLines") or []
    emotion_desc_lines: list[str] = []
    for e in emotion_lines_raw:
        from_id   = e.get("fromId", "")
        to_id     = e.get("toId", "")
        from_name = _id_to_name.get(from_id, from_id)
        to_name   = _id_to_name.get(to_id, to_id)
        arc: dict = e.get("arc") or {}

        # arc에서 현재 챕터까지 가장 최근 상태 탐색
        current_state = e.get("type", "")  # 초기값 폴백
        prev_state    = ""
        changed_at    = 0
        if arc:
            for ch_str in sorted(arc.keys(), key=lambda x: int(x)):
                ch_num = int(ch_str)
                if ch_num <= chapter:
                    if ch_num > changed_at:
                        # 직전 상태 기록 (변화 감지용)
                        if current_state != arc[ch_str]:
                            prev_state = current_state
                            changed_at = ch_num
                        current_state = arc[ch_str]

        if not current_state:
            continue

        line = f"{from_name} → {to_name}: {current_state}"
        # 이번 챕터에서 막 바뀐 경우 변화 명시
        if changed_at == chapter and prev_state:
            line += f"  ※이번 챕터 변화: {prev_state} → {current_state.split(' — ')[0]}"
        emotion_desc_lines.append(line)
    conflict_desc = ", ".join(world.get("conflictTypes") or [])
    title_hint = (world.get("trendTitles") or [""])[0]
    subject_hint = (world.get("trendSubjects") or [""])[0]
    role_beats = _get_role_guide(chapter_role)

    # 위키 컨텍스트 우선 — 없으면 NLM 팩트 폴백
    if wiki_context:
        facts_section = f"\n{wiki_context}\n"
    elif nlm_facts:
        facts_section = (
            f"\n## 갈등 트리거 (NLM 팩트)\n"
            f"{nlm_facts}\n"
            f"→ 나레이션 1~2문장으로만 녹일 것. 인물 대사에 직접 인용 금지.\n"
        )
    else:
        facts_section = ""

    char_a_arc = world.get("charAEmotionArc") or []
    char_b_arc = world.get("charBEmotionArc") or []
    char_a_emotion_now = char_a_arc[chapter - 1] if len(char_a_arc) >= chapter else ""
    char_b_emotion_now = char_b_arc[chapter - 1] if len(char_b_arc) >= chapter else ""

    char_a_name = world.get("charAName", "주인공A")
    char_b_name = world.get("charBName", "주인공B")

    # 스토리 비트 — 이전 챕터 사건 흐름 + 이번 챕터 계획
    story_beats = world.get("storyBeats") or []
    story_context_lines: list[str] = []
    if story_beats:
        prev_beats = story_beats[:chapter - 1]
        current_beat = story_beats[chapter - 1] if chapter <= len(story_beats) else ""
        if prev_beats:
            story_context_lines.append("\n## 이전 챕터 흐름 (이미 일어난 사건 — 반드시 이어받아 쓸 것)")
            for beat in prev_beats:
                story_context_lines.append(f"- {beat}")
        if current_beat:
            story_context_lines.append(f"\n## 이번 챕터 계획\n- {current_beat}")
    story_context = "\n".join(story_context_lines)

    inner_engine = _build_inner_engine_section(
        world, char_a_name, char_b_name, char_a_emotion_now, char_b_emotion_now
    )

    supporting = ""
    if world.get("supportingCast"):
        cast_lines = "\n".join(f"- {s}" for s in world["supportingCast"])
        supporting = f"\n## 조연\n{cast_lines}\n"

    def _char_block(prefix: str, name: str) -> str:
        label = 'A' if prefix == 'charA' else 'B'
        lines = [f"## 인물 {label}: {name}"]
        lines.append(f"- 직업: {world.get(f'{prefix}Occupation', '')}")
        # 겉모습/속모습 분리 구조 우선 — 없으면 personality 폴백
        public_face = world.get(f"{prefix}PublicFace") or world.get(f"{prefix}Personality", "")
        shadow      = world.get(f"{prefix}Shadow", "")
        if public_face:
            lines.append(f"- 겉모습 (남들이 보는 모습): {public_face}")
        if shadow:
            lines.append(f"- 속모습 (절대 들키고 싶지 않은 진짜 모습): {shadow}")
        lines.append(f"- 현재 상황: {world.get(f'{prefix}Situation', '')}")
        lines.append(f"- 목표: {world.get(f'{prefix}Goal', '')}")
        lines.append(f"- 숨겨진 비밀: {world.get(f'{prefix}Secret', '')}")
        lines.append(f"- 말투: {world.get(f'{prefix}SpeakingStyle', '')}")
        if world.get(f"{prefix}LieToSelf"):
            lines.append(f"- 자기기만 (서사 엔진): {world[f'{prefix}LieToSelf']}")
        if world.get(f"{prefix}Fear"):
            lines.append(f"- 가장 두려워하는 것: {world[f'{prefix}Fear']}")
        if world.get(f"{prefix}UnderStress"):
            lines.append(f"- 극한 상황 반응 (shadow가 새어나오는 방식): {world[f'{prefix}UnderStress']}")
        examples = world.get(f"{prefix}SpeakingExamples") or []
        if examples:
            lines.append(f"- 실제 대사 예시: {' / '.join(examples[:3])}")
        return "\n".join(lines)

    prev_ending_section = ""
    if prev_chapter_ending and chapter > 1:
        prev_ending_section = f"\n## 직전 챕터 마지막 장면 (여기서 정확히 이어받아 시작 — 인물·설정·복선 그대로 유지)\n{prev_chapter_ending.strip()}\n"

    return f"""=== CONTEXT ===

## 세계관
- 주제: {world.get("topic", "")}
- 장르: {world.get("genre", "")}
- 문체: {world.get("style", "")}
- 관계: {world.get("relationship", "")}
- 갈등 유형: {conflict_desc}
{"".join(chr(10) + "- 감정선: " + line for line in emotion_desc_lines)}
{f"- 제목 참고: {title_hint}" if title_hint else ""}{f"{chr(10)}- 주제 방향: {subject_hint}" if subject_hint else ""}
{story_context}
{prev_ending_section}

{_char_block("charA", char_a_name)}

{_char_block("charB", char_b_name)}
{supporting}{inner_engine}
{facts_section}
=== TASK ===

전체 {total_chapters}챕터 중 **챕터 {chapter} ({chapter_role})**을 쓴다. 이 챕터만 쓴다.

## 이 챕터의 필수 비트 (서사 단위 — 반드시 모두 전개)

[비트1] 여는 이미지 — 공간 또는 감각 디테일 1개로 시작. 최소 3문단.
[비트2] 일상의 균열 — 인물의 루틴에 이상 신호 1개 배치. 최소 3문단.
[비트3] 첫 대화 — 인물 간 대사 교환 3회전 이상. 최소 3문단.
[비트4] 긴장 상승 — 갈등이 표면화. 대사 교환 5회전 이상, 한 인물이 거짓말하거나 회피하는 순간 포함. 최소 4문단.
[비트5] 비밀의 징후 — 비밀 보유 인물의 행동 단서 2개를 자연스럽게 매립. 최소 2문단.
[비트6] 반전 또는 발견 — 핵심 정보가 드러나거나 암시. 독자만 눈치채는 구조. 최소 2문단.
[비트7] 닫는 훅 — 다음 챕터를 기다리게 만드는 마지막 문장 1개.

{role_beats}

## 분량 및 출력
- **최소 3,000자(공백 제외) 이상 반드시 출력할 것.** 7개 비트를 충실히 전개하면 3,000~4,500자가 됩니다.
- 분량이 부족하면 각 비트의 문단 수를 늘려 보완할 것. 절대 2,000자 미만으로 끊지 말 것.
- 비트를 건너뛰지 말 것. 비트 사이는 자연스러운 서술로 연결하고 비트 번호는 출력하지 않습니다.
- 서술체 + 대화체 혼합. 대화는 큰따옴표 사용. 대사 비율 전체의 40% 이상.
- 공간·시간·인물 구성이 바뀌는 장면 전환 지점마다 반드시 `---` 줄을 삽입하세요. 챕터 전체에서 5~8개 장면이 나와야 합니다.
- **챕터 본문 맨 첫 줄(첫 번째 씬)에도 반드시** 아래 이미지 메타데이터를 삽입하세요. 첫 씬은 `---` 없이 바로 시작하므로 본문 첫 줄이 `[IMAGE:]`여야 합니다.
- `---` 줄 바로 다음 줄에도 동일하게 아래 이미지 메타데이터를 삽입하세요. 이 줄들은 독자에게 보이지 않는 영상 제작 메타데이터입니다.
  - **`///`** — 본문 안에서 컷이 전환되는 지점마다 단독 줄로 삽입하세요. (씬 구분자 `---`와 별개)
    컷 전환 기준: 공간 이동 / 시간 경과 / 화자 전환 / 행동 전환 / 시점 전환 중 하나 발생 시.
    컷 수는 씬 길이에 따라 자유롭게 — 짧은 씬 2~4컷, 대화가 많은 씬 6~10컷, 긴 씬 최대 12컷.
    **균등하게 나누지 말 것. 의미 단위 그대로.**
  - **[IMAGE:]** — 씬 전체 분위기를 한 줄로 묘사 (공간·빛·인물 배치·소품. 감정·대화·설명 금지. 한국어만)
  - **[IMAGE_1:], [IMAGE_2:], ...** — 각 컷의 시각 묘사 한 줄. `///`로 나뉜 컷 수와 개수가 반드시 일치해야 합니다.
  - 규칙: 모든 IMAGE 태그는 한국어, 인물·소품·빛·공간만 묘사, 감정·대사 금지.
  - **모든 씬(첫 씬 포함)에 예외 없이 삽입. `///`와 [IMAGE_N:] 누락·개수 불일치 금지.**
  - 예시 (첫 번째 씬 — `---` 없이 시작, 5컷 — 공간·행동·대화 전환 기준):
    ```
    [IMAGE: 새벽 3시 아파트 주방, 형광등 불빛, 냉장고 문에 기댄 여자의 뒷모습]
    [IMAGE_1: 주방 창문, 도시 야경, 유리에 반사된 여자 얼굴]
    이수진은 새벽 세 시에 잠에서 깼다. 침대가 차가웠다.
    ///
    [IMAGE_2: 싱크대 위 식은 커피잔, 물방울 번짐]
    냉장고 문을 열었다가 닫았다. 배가 고픈 게 아니었다.
    ///
    [IMAGE_3: 냉장고 자석 메모지, 흐릿한 필기]
    메모지에는 그의 글씨로 '늦을 것 같아'라고만 적혀 있었다.
    ///
    [IMAGE_4: 여자의 맨발, 차가운 타일 위]
    이수진은 발이 시린 것도 몰랐다. 그냥 서 있었다.
    ///
    [IMAGE_5: 현관 신발장, 남자 구두 한 켤레만 없는 자리]
    신발장을 보았다. 그의 구두가 없었다. 어제도, 그제도.
    ```
  - 예시 (두 번째 씬 이후 — `---` 다음, 3컷 — 짧은 씬):
    ```
    ---
    [IMAGE: 지하 3층 주차장, 꺼진 헤드라이트, 핸들에 이마를 댄 남자의 실루엣]
    [IMAGE_1: 핸들에 눌린 남자의 손등, 손목시계 11시 47분]
    박준혁은 시동을 끄지 않은 채 한참을 그대로 있었다.
    ///
    [IMAGE_2: 운전석 창에 맺힌 빗방울, 흐린 도심 불빛 번짐]
    빗소리만 들렸다. 핸드폰이 세 번 울렸다가 꺼졌다.
    ///
    [IMAGE_3: 조수석 위 접힌 서류봉투, 도장 자국 선명]
    그는 봉투를 집어들었다가 다시 내려놓았다.
    ```
- 챕터 전체 씬 중 긴장·갈등·충격·반전이 가장 강한 씬 1개를 선정해 해당 씬의 `[IMAGE: ...]` 바로 앞 줄에 `[HOOK]` 을 단독으로 삽입하세요. `[HOOK]` 은 챕터 전체에서 정확히 1회만 사용합니다.
  - 예시:
    ```
    ---
    [HOOK]
    [IMAGE: 회의실 유리창에 비친 두 사람의 그림자, 서류가 바닥에 흩어진]
    [IMAGE_1: 회의실 유리창 클로즈업, 두 실루엣 겹침]
    [IMAGE_2: 바닥에 흩어진 서류들, 한 장이 부츠 앞코에 닿아 있는]
    "당신이 그 계약서를 빼돌렸군요."
    ```

지금 바로 챕터 {chapter} ({chapter_role}) 본문을 쓰세요."""


class ScriptGenerateRequest(BaseModel):
    world: dict
    chapter: int = 1
    chapterRole: str = "도입부"
    prev_chapter_ending: Optional[str] = None   # 직전 챕터 마지막 500자
    api_key: str = ""
    series_id: Optional[str] = None             # 위키 조회용 (없으면 NLM 폴백)


@router.post("/generate-script")
async def generate_script_streaming(req: ScriptGenerateRequest, background_tasks: BackgroundTasks):
    """
    STEP 2: 위키 컨텍스트(우선) / NLM 팩트(폴백) → Gemini 대본 스트리밍 생성
    1. wiki/{series_id}/ 에서 챕터 역할별 컨텍스트 조회
    2. 위키 없으면 NLM 팩트 쿼리 (cold start 폴백)
    3. 세계관 + 컨텍스트 → Gemini streaming 대본 생성
    4. 완료 후 챕터 본문을 위키에 자동 ingest (background)
    """
    from services.wiki_service import build_chapter_context, ingest_chapter
    api_key = _get_api_key(req.api_key)
    topic = req.world.get("topic", "")
    series_id = req.series_id or req.world.get("seriesId") or req.world.get("topic") or ""

    # 1) 위키 컨텍스트 우선 조회 (Gemini 호출 없음, 파일 읽기만)
    wiki_context = ""
    nlm_facts = ""
    if series_id:
        wiki_context = await asyncio.to_thread(
            build_chapter_context, series_id, req.chapterRole
        )

    if wiki_context:
        print(f"[STEP2] 위키 컨텍스트 ({len(wiki_context)}자) 주입")
    else:
        # 2) 위키 없으면 NLM 폴백 (cold start)
        nlm_facts = await asyncio.to_thread(
            query_chapter_facts, topic, req.chapter, req.chapterRole
        )
        nlm_facts = nlm_facts or ""
        print(f"[STEP2] NLM 폴백 ({len(nlm_facts)}자) 주입")

    # 3) 프롬프트 조립
    prompt = _build_script_prompt(
        req.world, req.chapter, req.chapterRole,
        nlm_facts, req.prev_chapter_ending or "",
        wiki_context,
    )

    # 3) Gemini SSE 스트리밍
    import httpx

    gemini_url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-pro:streamGenerateContent?alt=sse&key={api_key}"
    )
    system_instruction = _build_system_instruction()
    payload = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.85,
            "maxOutputTokens": 65536,
            "thinkingConfig": {
                "thinkingBudget": 2048,
            },
        },
    }

    # 스트리밍 청크를 수집 — 백그라운드 ingest에서 재사용
    collected_chunks: list[str] = []

    async def event_stream():
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", gemini_url, json=payload) as resp:
                    if resp.status_code != 200:
                        body = await resp.aread()
                        yield f"data: {json.dumps({'error': body.decode()})}\n\n"
                        return
                    async for raw_line in resp.aiter_lines():
                        if not raw_line.startswith("data: "):
                            continue
                        json_str = raw_line[6:].strip()
                        if json_str == "[DONE]":
                            continue
                        try:
                            parsed = json.loads(json_str)
                            parts = (
                                parsed.get("candidates", [{}])[0]
                                .get("content", {})
                                .get("parts", [])
                            )
                            # thought: true 파트(thinking 토큰) 제외, 실제 본문만 전송
                            for part in parts:
                                if not part.get("thought", False):
                                    text = part.get("text", "")
                                    if text:
                                        collected_chunks.append(text)
                                        yield f"data: {json.dumps({'text': text})}\n\n"
                        except Exception:
                            pass
            if nlm_facts:
                yield f"data: {json.dumps({'nlm_facts': nlm_facts})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    # 4) 스트리밍 완료 후 위키 자동 ingest (background)
    # BackgroundTasks는 StreamingResponse generator가 완전히 끝난 후 실행되므로
    # collected_chunks에 전체 본문이 수집된 상태
    def _ingest_after_stream():
        from services.wiki_service import ingest_chapter, _series_wiki_dir, init_wiki_from_world
        if not series_id or not api_key:
            return
        # 위키 폴더 없으면 먼저 초기화
        wiki_dir = _series_wiki_dir(series_id)
        if not wiki_dir.exists():
            init_wiki_from_world(series_id, req.world)
            print(f"[wiki] cold start 초기화: {series_id}")
        # 수집된 본문으로 ingest
        final_content = "".join(collected_chunks)
        if final_content and len(final_content) > 300:
            try:
                ingest_chapter(api_key, series_id, req.chapter, final_content)
                print(f"[wiki] ingest 완료: {series_id} ch{req.chapter} ({len(final_content)}자)")
            except Exception as e:
                print(f"[wiki] ingest 실패: {e}")

    background_tasks.add_task(_ingest_after_stream)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class SubSceneHintItem(BaseModel):
    sceneIndex: int
    subIndex: int
    text: str
    parentImageHint: str = ""   # 1차 씬 imageHint (맥락 참고용)

class SubImageHintsRequest(BaseModel):
    items: List[SubSceneHintItem]
    api_key: str = ""

class SubSceneHintResult(BaseModel):
    sceneIndex: int
    subIndex: int
    imageHint: str

@router.post("/sub-image-hints")
async def generate_sub_image_hints(req: SubImageHintsRequest):
    """
    서브씬 텍스트 → 2차 세부 이미지 힌트 생성
    - 서브씬 텍스트가 확정된 후 별도 호출
    - 각 서브씬에 대해 한 줄 시각 묘사 (공간·인물·소품·빛) 반환
    """
    api_key = _get_api_key(req.api_key)
    if not req.items:
        return {"results": []}

    # 배치 프롬프트 — 한 번의 Gemini 호출로 모든 서브씬 처리
    items_text = "\n".join(
        f"[{i.sceneIndex}-{i.subIndex}] 1차힌트={i.parentImageHint or '없음'} | 텍스트={i.text[:120]}"
        for i in req.items
    )

    prompt = f"""아래는 한국 드라마 대본의 서브씬 목록입니다.
각 서브씬에 대해 2차 세부 이미지 힌트를 작성하세요.

규칙:
- 1차힌트(공간·분위기)는 이미 확정된 정보입니다. 2차 힌트는 그 위에 얹히는 추가 세부묘사만 작성.
- 1차힌트 내용을 반복하지 말 것. 인물의 표정·시선·자세·소품·조명 변화 등 미시적 디테일만.
- 한국어. 30자 이내. 쉼표로 구분.
- 감정 해석·대사·설명 금지.

서브씬 목록:
{items_text}

출력 형식 (JSON 배열만, 다른 텍스트 없이):
[
  {{"sceneIndex": 0, "subIndex": 0, "imageHint": "추가 세부묘사"}},
  ...
]"""

    import httpx
    gemini_url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.5, "maxOutputTokens": 4000},
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(gemini_url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw = data["candidates"][0]["content"]["parts"][0]["text"].strip()

        # JSON 파싱 — 마크다운 코드블록 제거
        raw = re.sub(r"^```[a-z]*\n?", "", raw).rstrip("` \n")
        results = json.loads(raw)
        return {"results": results}

    except Exception as e:
        # 실패 시 빈 결과 반환 (파이프라인 중단 방지)
        print(f"[sub-image-hints] 오류: {e}")
        return {"results": []}


@router.post("/outline", response_model=OutlineResponse)
def generate_outline(req: OutlineRequest):
    """제목+주제 → 시리즈 개요 텍스트 생성"""
    api_key = _get_api_key(req.api_key)

    prompt = f"""
한국 웹소설/드라마 시리즈 기획안의 개요를 3~4문장으로 작성해주세요.

트랜드 키워드: "{req.topic}"
제목: "{req.title}"
주제: "{req.subject}"

조건:
- 두 남녀 주인공의 교차 서사 구조 언급
- 사회적 메시지와 인간적 감동을 동시에 담은 문장
- "이건 남의 이야기가 아니다"는 공감대 형성 방향
- 웹소설/드라마 기획서 스타일의 매력적인 문체
- 순수 텍스트만 출력 (마크다운, JSON 없이)
"""

    raw = _call_gemini(api_key, prompt, max_tokens=512, temperature=0.85)
    return OutlineResponse(outline=raw.strip())


# ── STEP 1: 시놉시스 카드 생성 ────────────────────────────────────────────────

class TrendContext(BaseModel):
    news_headlines: list[str] = []
    viral_titles: list[str] = []
    concepts: list[str] = []


class SynopsisRequest(BaseModel):
    keyword: str
    trend_context: Optional[TrendContext] = None
    charA_profile: Optional[dict] = None   # 선택된 charA 캐릭터 상세 (shadow/fear 포함)
    charB_profile: Optional[dict] = None   # 선택된 charB 캐릭터 상세 (shadow/fear 포함)
    api_key: str = ""


class SynopsisCard(BaseModel):
    title: str
    logline: str
    charA_summary: str
    charB_summary: str
    conflict_summary: str
    genre: str
    mood: str


class SynopsisResponse(BaseModel):
    synopses: list[SynopsisCard]


@router.post("/generate-synopsis", response_model=SynopsisResponse)
def generate_synopsis(req: SynopsisRequest):
    """트랜드 키워드 → 시놉시스 카드 3개 생성 (세계관 자동 설정용)"""
    api_key = _get_api_key(req.api_key)

    trend_block = ""
    if req.trend_context:
        ctx = req.trend_context
        if ctx.news_headlines:
            trend_block += f"\n관련 뉴스: {' / '.join(ctx.news_headlines[:3])}"
        if ctx.viral_titles:
            trend_block += f"\n바이럴 제목: {' / '.join(ctx.viral_titles[:3])}"
        if ctx.concepts:
            trend_block += f"\n컨셉 패턴: {' / '.join(ctx.concepts[:2])}"

    # 사전 선택된 캐릭터 프로필 블록 구성
    char_profile_block = ""
    if req.charA_profile or req.charB_profile:
        char_profile_block = "\n\n## 사전 선택된 주인공 프로필 (이 캐릭터들을 반드시 시놉시스에 반영)"
        for label, profile in [("남자 주인공 (charA)", req.charA_profile), ("여자 주인공 (charB)", req.charB_profile)]:
            if not profile:
                continue
            name = profile.get("name", "")
            occupation = profile.get("occupation", "")
            core = profile.get("core") or {}
            public_face = core.get("public_face") or core.get("personality", "")
            shadow = core.get("shadow", "")
            fear = core.get("fear", "")
            lie_to_self = core.get("lie_to_self", "")
            char_profile_block += f"\n\n### {label}: {name} ({occupation})"
            if public_face:
                char_profile_block += f"\n- 겉모습 (남들이 보는 모습): {public_face}"
            if shadow:
                char_profile_block += f"\n- 속모습 (절대 들키고 싶지 않은 진짜 모습): {shadow}"
            if fear:
                char_profile_block += f"\n- 가장 두려워하는 것: {fear}"
            if lie_to_self:
                char_profile_block += f"\n- 자기기만 (서사 엔진): {lie_to_self}"

    prompt = f"""당신은 한국 웹소설 기획 전문가입니다.
트랜드 키워드: "{req.keyword}"{trend_block}{char_profile_block}

이 키워드를 소재로 한 한국 웹소설 시리즈 시놉시스 카드 3개를 만들어주세요.
3개는 반드시 서로 다른 갈등 유형과 감정 톤을 가져야 합니다.
{"사전 선택된 주인공 프로필이 있는 경우, 그 캐릭터의 shadow(속모습)와 fear(두려움)에서 갈등이 자연스럽게 흘러나와야 합니다. 시놉시스를 캐릭터에게 강요하지 말고, 캐릭터의 내면에서 시놉시스를 이끌어내세요." if (req.charA_profile or req.charB_profile) else ""}
핵심 공식: 팩트(사회 이슈) × 막장(불륜·배신·집착·복수·이혼·오피스 로맨스) = 시리즈
모든 카드에 이 공식이 적용되어야 합니다.

아래 JSON 형식만 출력하세요. 설명 없이 순수 JSON만:

{{
  "synopses": [
    {{
      "title": "감성적인 웹소설 제목",
      "logline": "두 주인공의 운명적 만남과 핵심 갈등을 1~2문장으로",
      "charA_summary": "남성 주인공 — 나이·직업·현재 상황·숨겨진 비밀 1줄 (예: 38세 건설회사 부장, 이혼 직전 숨기고 있는 부동산 사기)",
      "charB_summary": "여성 주인공 — 나이·직업·현재 상황·숨겨진 비밀 1줄 (예: 34세 부동산 중개사, 남자 주인공 회사에서 일했던 과거)",
      "conflict_summary": "두 사람 사이의 핵심 갈등 — 반드시 막장 요소 포함",
      "genre": "드라마/멜로",
      "mood": "긴장·갈등·로맨스 중 주된 감정 톤"
    }},
    {{ ... }},
    {{ ... }}
  ]
}}

조건:
- 3개 카드는 서로 다른 막장 요소 (불륜/배신/복수 등 겹치지 않게)
- 제목은 키워드를 직접 쓰지 말고 은유적으로
- 모든 텍스트는 한국어
"""

    raw = _call_gemini(api_key, prompt, max_tokens=4096, temperature=0.95)
    data = _extract_json(raw)
    cards = [SynopsisCard(**c) for c in data.get("synopses", [])]
    return SynopsisResponse(synopses=cards)


# ── STEP 1.5: 시놉시스 → 세계관 자동 확장 ────────────────────────────────────

class ExpandWorldRequest(BaseModel):
    synopsis: dict
    keyword: str
    pre_selected_charA: Optional[str] = None   # 사전 선택된 charA id (있으면 Gemini 선택 생략)
    pre_selected_charB: Optional[str] = None   # 사전 선택된 charB id
    api_key: str = ""


@router.post("/expand-world")
def expand_world(req: ExpandWorldRequest):
    """선택한 시놉시스 카드 → world.json 전체 자동 생성"""
    api_key = _get_api_key(req.api_key)

    # 캐릭터 인덱스 + 개별 상세 파일 로드
    chars_dir = Path(__file__).parent.parent.parent.parent / "apps" / "web" / "src" / "data" / "characters"
    index_path = chars_dir / "_index.json"
    chars_lookup: dict = {}   # id → 개별 파일 전체 데이터
    chars_block_lines: list[str] = []
    try:
        with open(index_path, encoding="utf-8") as f:
            index_data = json.load(f)
        for c in index_data.get("characters", []):
            mid = c["id"]
            # 개별 상세 파일 로드
            detail_path = chars_dir / f"{mid}.json"
            detail: dict = {}
            if detail_path.exists():
                try:
                    with open(detail_path, encoding="utf-8") as df:
                        detail = json.load(df)
                except Exception:
                    pass
            # 인덱스 + 상세 합성 (상세 우선)
            merged = {**c, **detail}
            chars_lookup[mid] = merged
            core = detail.get("core") or {}
            situations_str = " / ".join((detail.get("situations") or [])[:4])
            chars_block_lines.append(
                f"{mid}|{c['name']}|{c['gender']}|{c['age']}|{c['occupation']}"
                f"|성격:{core.get('personality', c.get('role',''))}"
                f"|말투:{core.get('speaking_style','')}\n"
                f"  상황후보: {situations_str}"
            )
        chars_block = "\n".join(chars_block_lines)
    except Exception:
        chars_block = ""
        chars_lookup = {}

    s = req.synopsis

    # 사전 선택된 캐릭터 안내 블록
    presel_block = ""
    if req.pre_selected_charA or req.pre_selected_charB:
        presel_block = "\n\n## 사전 선택된 주인공 (아래 id를 반드시 그대로 사용)"
        if req.pre_selected_charA:
            a_info = chars_lookup.get(req.pre_selected_charA, {})
            presel_block += f"\n- charA 고정: {req.pre_selected_charA} ({a_info.get('name','')} / {a_info.get('occupation','')})"
        if req.pre_selected_charB:
            b_info = chars_lookup.get(req.pre_selected_charB, {})
            presel_block += f"\n- charB 고정: {req.pre_selected_charB} ({b_info.get('name','')} / {b_info.get('occupation','')})"

    # 사전 선택 제약 조건 (f-string 밖에서 생성 — Python 3.11 백슬래시 금지 우회)
    presel_constraint = ""
    if req.pre_selected_charA or req.pre_selected_charB:
        a_id = req.pre_selected_charA or "자유선택"
        b_id = req.pre_selected_charB or "자유선택"
        presel_constraint = f"\n- 사전 선택된 주인공이 있는 경우 해당 id를 그대로 사용 (재선택 금지): charA={a_id}, charB={b_id}"

    prompt = f"""당신은 한국 웹소설 세계관 설계 전문가입니다.
아래 시놉시스 카드를 바탕으로 웹소설 세계관을 완성해주세요.

## 시놉시스
- 제목: {s.get("title", "")}
- 로그라인: {s.get("logline", "")}
- 남자 주인공: {s.get("charA_summary", "")}
- 여자 주인공: {s.get("charB_summary", "")}
- 핵심 갈등: {s.get("conflict_summary", "")}
- 장르: {s.get("genre", "")}
- 톤: {s.get("mood", "")}
{presel_block}
## 사용 가능한 캐릭터 풀 (id|이름|성별|나이|직업|성격|말투 / 상황후보 목록)
{chars_block}

아래 JSON 형식만 출력하세요. 설명 없이 순수 JSON만:

{{
  "topic": "{req.keyword}",
  "genre": "장르",
  "style": "혼합형",
  "relationship": "두 주인공의 관계",
  "conflictTypes": ["갈등유형1", "갈등유형2"],
  "chapters": 6,
  "charA": "캐릭터풀에서 선택한 남자 주인공 id",
  "charAName": "이름 (캐릭터풀 그대로)",
  "charAOccupation": "직업 (캐릭터풀 그대로)",
  "charAPersonality": "성격 (캐릭터풀 그대로 복사)",
  "charASpeakingStyle": "말투 (캐릭터풀 그대로 복사)",
  "charASituation": "해당 캐릭터 상황후보 중 이번 시놉시스와 가장 잘 맞는 항목 1개를 원문 그대로",
  "charAGoal": "이 시리즈에서 원하는 것",
  "charASecret": "상대방이 모르는 비밀",
  "charAWant": "표면 욕망 — 이 인물이 원한다고 생각하는 것 (구체적 목표)",
  "charANeed": "내면 결핍 — 이 인물이 실제로 필요한 것 (이야기 끝에서 얻거나 잃는 것)",
  "charAEmotionArc": [
    "챕터1: 감정 상태 한 줄",
    "챕터2: 감정 상태 한 줄",
    "챕터3: 감정 상태 한 줄",
    "챕터4: 감정 상태 한 줄",
    "챕터5: 감정 상태 한 줄",
    "챕터6: 감정 상태 한 줄"
  ],
  "charB": "캐릭터풀에서 선택한 여자 주인공 id",
  "charBName": "이름 (캐릭터풀 그대로)",
  "charBOccupation": "직업 (캐릭터풀 그대로)",
  "charBPersonality": "성격 (캐릭터풀 그대로 복사)",
  "charBSpeakingStyle": "말투 (캐릭터풀 그대로 복사)",
  "charBSituation": "해당 캐릭터 상황후보 중 이번 시놉시스와 가장 잘 맞는 항목 1개를 원문 그대로",
  "charBGoal": "이 시리즈에서 원하는 것",
  "charBSecret": "상대방이 모르는 비밀",
  "charBWant": "표면 욕망 — 이 인물이 원한다고 생각하는 것 (구체적 목표)",
  "charBNeed": "내면 결핍 — 이 인물이 실제로 필요한 것 (이야기 끝에서 얻거나 잃는 것)",
  "charBEmotionArc": [
    "챕터1: 감정 상태 한 줄",
    "챕터2: 감정 상태 한 줄",
    "챕터3: 감정 상태 한 줄",
    "챕터4: 감정 상태 한 줄",
    "챕터5: 감정 상태 한 줄",
    "챕터6: 감정 상태 한 줄"
  ],
  "coreWound": "두 주인공이 서로에게 끌리는 근본 이유 — 같은 상처를 다른 방식으로 가진 인물들. 1~2문장.",
  "emotionLines": [
    {{
      "id": "1",
      "fromId": "charA id",
      "toId": "charB id",
      "type": "챕터1 시작 시점의 초기 감정 유형",
      "color": "#hex색상",
      "arc": {{
        "1": "초기 감정 상태 한 줄",
        "3": "사건으로 인한 변화 한 줄",
        "5": "위기 시점 감정 상태 한 줄",
        "6": "결말 시점 감정 상태 한 줄"
      }}
    }}
  ],
  "supportingCast": ["조연 설명 1줄", "조연 설명 1줄"],
  "storyBeats": [
    "챕터1: [핵심 사건 1~2문장]",
    "챕터2: [핵심 사건 1~2문장]",
    "챕터3: [핵심 사건 1~2문장] → 감정선 변화: [fromId]↔[toId] [이전감정]→[새감정]",
    "챕터4: [핵심 사건 1~2문장]",
    "챕터5: [핵심 사건 1~2문장] → 감정선 변화: [fromId]↔[toId] [이전감정]→[새감정]",
    "챕터6: [핵심 사건 1~2문장]"
  ],
  "trendTitles": ["{s.get("title", "")}"],
  "trendSubjects": ["{s.get("logline", "")}"]
}}

조건:
- charA/charB는 반드시 캐릭터 풀 id 중에서 선택 (성별·나이·직업이 시놉시스와 맞는 것으로){presel_constraint}
- charAPersonality/charBPersonality, charASpeakingStyle/charBSpeakingStyle: 캐릭터 풀 값 그대로 복사. 절대 재작성 금지
- charASituation/charBSituation: 반드시 해당 캐릭터의 상황후보 목록 중 1개를 원문 그대로. 목록에 없는 상황 창작 금지
- conflictTypes는 2개, 막장 요소 포함
- emotionLines는 2~3개 (복잡한 감정선)
- charAWant ≠ charANeed: Want는 구체적 행동 목표, Need는 심리적 결핍
- charAEmotionArc / charBEmotionArc: 6챕터 흐름이 도입→심화→폭발→해소로 자연스럽게 이어질 것
- coreWound: 두 인물의 상처가 서로를 끌어당기면서 동시에 상처 입히는 구조로
- emotionLines.type: 챕터1 시작 시점의 초기 감정 (이후 arc로 변화를 기록)
- emotionLines.arc: 감정이 변화하는 챕터 번호만 기록. 변화 없는 챕터는 생략. 반드시 "1"(초기)은 포함
- emotionLines.arc 값: "감정유형 — 변화 원인 한 줄" 형식
- storyBeats: 실제 사건(事件) 중심. 그 사건이 감정선을 바꾸는 경우에만 "→ 감정선 변화:" 마커 추가
- storyBeats와 emotionLines.arc는 반드시 일치해야 함 (사건이 감정선 변화를 유발하는 구조)
- 모든 텍스트 한국어
"""

    raw = _call_gemini(api_key, prompt, max_tokens=8192, temperature=0.8)
    world = _extract_json(raw)

    # 사전 선택된 charA/charB를 강제 적용 (Gemini가 무시한 경우에도 덮어씀)
    if req.pre_selected_charA and req.pre_selected_charA in chars_lookup:
        world["charA"] = req.pre_selected_charA
        a_info = chars_lookup[req.pre_selected_charA]
        world.setdefault("charAName", a_info.get("name", ""))
        world.setdefault("charAOccupation", a_info.get("occupation", ""))
    if req.pre_selected_charB and req.pre_selected_charB in chars_lookup:
        world["charB"] = req.pre_selected_charB
        b_info = chars_lookup[req.pre_selected_charB]
        world.setdefault("charBName", b_info.get("name", ""))
        world.setdefault("charBOccupation", b_info.get("occupation", ""))

    # 후처리: Gemini가 재작성해도 개별 파일의 원본값으로 덮어씀 (핵심 인물 데이터 보호)
    for role in ("charA", "charB"):
        char_id = world.get(role, "")
        if char_id and char_id in chars_lookup:
            m = chars_lookup[char_id]
            core = m.get("core") or {}
            # 개별 파일 값으로 덮어씀 — Gemini 재작성 방지
            for field, key in [
                ("public_face",       f"{role}PublicFace"),
                ("shadow",            f"{role}Shadow"),
                ("personality",       f"{role}Personality"),
                ("speaking_style",    f"{role}SpeakingStyle"),
                ("fear",              f"{role}Fear"),
                ("lie_to_self",       f"{role}LieToSelf"),
                ("under_stress",      f"{role}UnderStress"),
                ("speaking_examples", f"{role}SpeakingExamples"),
            ]:
                if core.get(field):
                    world[key] = core[field]

    return world
