"""
nlm_fact_service.py — NLM 챕터별 팩트 쿼리 전담 서비스
서사 역할(도입부/전개/클라이맥스/결말)에 맞는 쿼리 템플릿을 사용해
NotebookLM에서 구조화된 팩트를 추출한다.
"""
import json
import re
from pathlib import Path
from typing import Optional

# ── 노트북 매핑 ────────────────────────────────────────────────────────────────
# 주제 키워드 → NLM 노트북 ID
TOPIC_NOTEBOOK_MAP: dict[str, str] = {
    "부동산": "a8891e02-4fc9-4593-8fc7-fb13333ea6a7",
    "전세":   "a8891e02-4fc9-4593-8fc7-fb13333ea6a7",
    "경제":   "85362656-b5a6-4672-a874-619b99fc55e5",
    "재테크": "85362656-b5a6-4672-a874-619b99fc55e5",
    "주식":   "85362656-b5a6-4672-a874-619b99fc55e5",
    "건강":   "9d3c21fe-e9e5-41a8-8c67-eed5090f799a",
    "의학":   "9d3c21fe-e9e5-41a8-8c67-eed5090f799a",
    "심리":   "6a6dee66-1811-4939-80cc-4ab57f50810b",
    "자기계발": "6a6dee66-1811-4939-80cc-4ab57f50810b",
}
NLM_SERIES_NOTEBOOK_ID = "a879a2d9-8cb2-4182-b14a-b04dcc49d448"  # [LD] 웹소설 (기본)

# ── 쿼리 템플릿 로드 ──────────────────────────────────────────────────────────
_TEMPLATE_PATH = Path(__file__).parent.parent / "data" / "chapter_query_templates.json"
_TEMPLATES: dict = {}


def _load_templates() -> dict:
    """chapter_query_templates.json 로드 및 캐싱"""
    global _TEMPLATES
    if _TEMPLATES:
        return _TEMPLATES
    try:
        with open(_TEMPLATE_PATH, encoding="utf-8") as f:
            _TEMPLATES = json.load(f)
    except Exception as e:
        print(f"[NLM] 템플릿 로드 실패, 기본값 사용: {e}")
        _TEMPLATES = {
            "전개": {
                "query_template": "'{topic}' 관련 실제 사례와 에피소드를 알려줘. 3~5가지.",
                "fact_type": "case_study",
            }
        }
    return _TEMPLATES


# ── 공개 함수 ─────────────────────────────────────────────────────────────────

def pick_notebook(topic: str) -> str:
    """주제 키워드 기반 최적 NLM 노트북 ID 선택"""
    if not topic:
        return NLM_SERIES_NOTEBOOK_ID
    for keyword, nb_id in TOPIC_NOTEBOOK_MAP.items():
        if keyword in topic:
            return nb_id
    return NLM_SERIES_NOTEBOOK_ID


def normalize_role(chapter_role: str, known_roles: list[str]) -> str:
    """
    서사 역할 문자열을 known_roles 중 하나로 정규화.
    "전개①", "클라이맥스②" 같은 접미사 변형 처리.
    완전 일치 → startswith 매칭 → 첫 번째 폴백 순.
    """
    if chapter_role in known_roles:
        return chapter_role
    for role in known_roles:
        if chapter_role.startswith(role):
            return role
    return known_roles[0] if known_roles else chapter_role


def _get_query_template(chapter_role: str) -> dict:
    """
    chapter_role 정규화 후 템플릿 반환.
    "전개①", "전개②" 등 접미사가 붙은 경우 startswith 매칭.
    매칭 실패 시 "전개" 폴백.
    """
    templates = _load_templates()
    key = normalize_role(chapter_role, list(templates.keys()))
    return templates.get(key, list(templates.values())[0])


def _remove_citations(text: str) -> str:
    """인용 번호 [1], [2,3] 등 제거"""
    return re.sub(r'\[\d+(?:,\s*\d+)*\]', '', text)


def trim_facts(raw_text: str, max_chars: int = 300) -> str:
    """
    팩트 텍스트를 max_chars 이내로 자른다.
    문장 단위로 자르되, 중간에 끊기지 않도록 마지막 완결 문장까지만 포함.
    """
    if len(raw_text) <= max_chars:
        return raw_text
    # 문장 단위 분리 (마침표/느낌표/물음표 기준)
    sentences = re.split(r'(?<=[.!?])\s+', raw_text.strip())
    result = ''
    for s in sentences:
        if len(result) + len(s) + 1 > max_chars:
            break
        result = (result + ' ' + s).strip()
    return result if result else raw_text[:max_chars]


def parse_structured_facts(raw_text: str, fact_type: str) -> dict:
    """
    raw 팩트 텍스트에서 수치·날짜·고유명사를 추출해 구조화 dict 반환.
    반환 형식: { "raw": str, "fact_type": str, "numbers": [...], "dates": [...] }
    """
    numbers = re.findall(r'\d[\d,]*\.?\d*\s*[%조억만천원달러]', raw_text)
    dates = re.findall(r'\d{4}년|\d{1,2}월|\d{1,2}일', raw_text)
    return {
        "raw": raw_text,
        "fact_type": fact_type,
        "numbers": numbers,
        "dates": dates,
    }


def query_chapter_facts(
    topic: str,
    chapter: int,
    chapter_role: str,
) -> Optional[str]:
    """
    NLM에서 챕터별 팩트 쿼리. 실패 시 None 반환 (대본 생성은 계속).

    Args:
        topic: 시리즈 주제 (노트북 선택 및 쿼리 문구에 사용)
        chapter: 챕터 번호 (1~N)
        chapter_role: 서사 역할 ("도입부", "전개", "전개①", "클라이맥스", "결말" 등)

    Returns:
        팩트 텍스트 (50자 이상) 또는 None
    """
    try:
        from notebooklm_tools.cli.utils import get_client

        notebook_id = pick_notebook(topic)
        template = _get_query_template(chapter_role)
        fact_type = template.get("fact_type", "general")

        base_query = template["query_template"].replace("{topic}", topic)
        query_text = f"챕터 {chapter}({chapter_role}) 대본 작성을 위해: {base_query}"

        with get_client() as client:
            result = client.query(notebook_id, query_text, timeout=60.0)

        if isinstance(result, dict):
            raw = result.get("answer") or result.get("text") or ""
        else:
            raw = str(result or "")

        raw = _remove_citations(raw).strip()
        raw = trim_facts(raw, max_chars=300)
        return raw if len(raw) > 50 else None

    except Exception as e:
        print(f"[NLM] 팩트 쿼리 실패 (ch{chapter}): {e}")
        return None
