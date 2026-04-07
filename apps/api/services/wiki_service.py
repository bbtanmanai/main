"""
LinkDrop 시리즈 위키 서비스 — Karpathy LLM Wiki 패턴
저장소: 로컬 파일시스템 (시리즈별 폴더 분리)

C:/LinkDropV2/
├── source/
│   └── {series_id}/              ← 시리즈별 원본 (절대 수정 금지)
│       ├── ch01__chapter__*.md
│       └── url__*.md
└── wiki/
    ├── index.md                  ← 전체 시리즈 목차
    ├── log.md                    ← 전체 작업 기록
    └── {series_id}/              ← 시리즈별 위키
        ├── world.md
        ├── foreshadows.md
        ├── timeline.md
        ├── facts.md
        ├── theme.md
        ├── characters/
        │   └── {name}.md
        └── character_arcs/
            └── {name}.md
"""

import json
import re
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

# ── 루트 경로 ─────────────────────────────────────────────────────────────────
_ROOT        = Path("C:/LinkDropV2")
SOURCE_ROOT  = _ROOT / "source"
WIKI_ROOT    = _ROOT / "wiki"
INDEX_MD     = WIKI_ROOT / "index.md"   # 전체 시리즈 목차
LOG_MD       = WIKI_ROOT / "log.md"     # 전체 작업 기록

_API_BASE    = Path(__file__).parent.parent
_SCHEMA_PATH = _API_BASE / "data"    / "wiki_schema.json"
_INGEST_PROMPT  = _API_BASE / "prompts" / "wiki_ingest.md"
_QUERY_PROMPT   = _API_BASE / "prompts" / "wiki_query.md"
_LINT_PROMPT    = _API_BASE / "prompts" / "wiki_lint.md"


# ── 시리즈별 경로 헬퍼 ────────────────────────────────────────────────────────
def _series_wiki_dir(series_id: str) -> Path:
    """wiki/{series_id}/"""
    safe = _safe_id(series_id)
    return WIKI_ROOT / safe


def _series_source_dir(series_id: str) -> Path:
    """source/{series_id}/"""
    safe = _safe_id(series_id)
    return SOURCE_ROOT / safe


def _series_index(series_id: str) -> Path:
    """wiki/{series_id}/index.md  ← 시리즈 내부 목차"""
    return _series_wiki_dir(series_id) / "index.md"


def _series_log(series_id: str) -> Path:
    """wiki/{series_id}/log.md  ← 시리즈 내부 로그"""
    return _series_wiki_dir(series_id) / "log.md"


def _slug_to_path(series_id: str, slug: str) -> Path:
    """slug 'characters/민재' → wiki/{series_id}/characters/민재.md"""
    return _series_wiki_dir(series_id) / f"{slug}.md"


def _safe_id(series_id: str) -> str:
    """폴더명으로 사용 가능한 안전한 ID"""
    return re.sub(r'[\\/:*?"<>|\s]', '_', series_id)[:60]


def _source_filename(source_id: str, source_type: str, title: str) -> str:
    safe = re.sub(r'[\\/:*?"<>|]', '_', title)[:40]
    return f"{source_id}__{source_type}__{safe}.md"


# ── 초기화 ────────────────────────────────────────────────────────────────────
def _ensure_dirs(series_id: str):
    _series_wiki_dir(series_id).mkdir(parents=True, exist_ok=True)
    (_series_wiki_dir(series_id) / "character_arcs").mkdir(exist_ok=True)
    _series_source_dir(series_id).mkdir(parents=True, exist_ok=True)
    WIKI_ROOT.mkdir(parents=True, exist_ok=True)
    if not INDEX_MD.exists():
        INDEX_MD.write_text("# Wiki Index\n\n전체 시리즈 목차\n\n", encoding="utf-8")
    if not LOG_MD.exists():
        LOG_MD.write_text("# Wiki Log\n\n전체 작업 기록\n\n", encoding="utf-8")
    if not _series_index(series_id).exists():
        _series_index(series_id).write_text(
            f"# {series_id} — Wiki Index\n\n"
            "## world\n## character_arc\n"
            "## foreshadow\n## timeline\n## fact\n## theme\n",
            encoding="utf-8"
        )
    if not _series_log(series_id).exists():
        _series_log(series_id).write_text(
            f"# {series_id} — Log\n\n", encoding="utf-8"
        )


# ── 파일 I/O ──────────────────────────────────────────────────────────────────
def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def _write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def _append(path: Path, text: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(text)


# ── 로그 / 인덱스 갱신 ────────────────────────────────────────────────────────
def _log(series_id: str, action: str, title: str, detail: str = ""):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    entry = f"\n## [{now}] {action} | {title}\n"
    if detail:
        entry += f"{detail}\n"
    # 시리즈 내부 로그
    _append(_series_log(series_id), entry)
    # 전체 로그 (시리즈 ID 포함)
    _append(LOG_MD, f"\n## [{now}] [{series_id}] {action} | {title}\n")


def _update_index(series_id: str, additions: list[str]):
    """시리즈 index.md 에 줄 추가 (중복 제외)"""
    if not additions:
        return
    current = _read(_series_index(series_id))
    new_lines = [l for l in additions if l.strip() and l not in current]
    if new_lines:
        _append(_series_index(series_id), "\n" + "\n".join(new_lines) + "\n")


# ── 스키마 / 프롬프트 ─────────────────────────────────────────────────────────
def load_schema() -> dict:
    return json.loads(_SCHEMA_PATH.read_text(encoding="utf-8"))


def load_prompt(operation: str) -> str:
    """
    프롬프트 파일을 읽어 반환.
    <!-- INCLUDE: {filename}#{BLOCK} --> 태그가 있으면 해당 파일의 블록을 인라인으로 치환.
    원칙은 wiki_query.md 한 곳에만 두고 다른 프롬프트가 참조하는 단일 소스 패턴.
    """
    path_map = {
        "ingest": _INGEST_PROMPT,
        "query":  _QUERY_PROMPT,
        "lint":   _LINT_PROMPT,
    }
    p = path_map[operation]
    if not p.exists():
        raise FileNotFoundError(f"Wiki prompt not found: {operation}")
    raw = p.read_text(encoding="utf-8")

    # <!-- INCLUDE: wiki_query.md#SYSTEM_INSTRUCTION --> 처리
    def _resolve_include(match: re.Match) -> str:
        filename, block = match.group(1).strip(), match.group(2).strip()
        src = (p.parent / filename)  # 같은 prompts/ 폴더 기준
        if not src.exists():
            return f"[INCLUDE ERROR: {filename} not found]"
        content = src.read_text(encoding="utf-8")
        block_match = re.search(
            rf"<!-- {re.escape(block)} -->([\s\S]+?)<!-- /{re.escape(block)} -->",
            content,
        )
        return block_match.group(1).strip() if block_match else f"[INCLUDE ERROR: block {block} not found]"

    return re.sub(r"<!-- INCLUDE:\s*(\S+?)#(\S+?)\s*-->", _resolve_include, raw)


# ── Gemini 호출 ────────────────────────────────────────────────────────────────
def _call_gemini(api_key: str, system_prompt: str, user_content: str, max_tokens: int = 8192) -> str:
    import httpx
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-pro:generateContent?key={api_key}"
    )
    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_content}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": max_tokens,
            "thinkingConfig": {"thinkingBudget": 1024},
        },
    }
    resp = httpx.post(url, json=payload, timeout=120.0)
    resp.raise_for_status()
    data = resp.json()
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "".join(p.get("text", "") for p in parts if not p.get("thought", False))


def _extract_json(raw: str) -> dict:
    m = re.search(r"```(?:json)?\s*([\s\S]+?)```", raw)
    if m:
        raw = m.group(1)
    raw = raw.strip()
    try:
        from json_repair import repair_json
        return json.loads(repair_json(raw))
    except ImportError:
        return json.loads(raw)


# ── 위키 페이지 목록 ──────────────────────────────────────────────────────────
def list_wiki_pages(series_id: str) -> list[dict]:
    """wiki/{series_id}/ 내 모든 .md 파일 (index/log 제외)"""
    wiki_dir = _series_wiki_dir(series_id)
    if not wiki_dir.exists():
        return []
    pages = []
    for md_file in sorted(wiki_dir.rglob("*.md")):
        if md_file.name in ("index.md", "log.md"):
            continue
        slug = md_file.relative_to(wiki_dir).with_suffix("").as_posix()
        content = md_file.read_text(encoding="utf-8")
        lines = [l for l in content.splitlines() if l.strip()]
        title = lines[0].lstrip("#").strip() if lines else slug
        summary = lines[1][:120] if len(lines) > 1 else ""
        pages.append({
            "slug": slug,
            "title": title,
            "summary": summary,
            "content_md": content,
            "updated_at": datetime.fromtimestamp(md_file.stat().st_mtime).isoformat(),
        })
    return pages


def read_wiki_page(series_id: str, slug: str) -> Optional[str]:
    path = _slug_to_path(series_id, slug)
    return _read(path) or None


def write_wiki_page(series_id: str, slug: str, content_md: str):
    _write(_slug_to_path(series_id, slug), content_md)


def append_wiki_page(series_id: str, slug: str, content_md: str):
    _append(_slug_to_path(series_id, slug), "\n" + content_md)


def delete_wiki_page(series_id: str, slug: str):
    path = _slug_to_path(series_id, slug)
    if path.exists():
        path.unlink()


# ── 오퍼레이션 1: INGEST ──────────────────────────────────────────────────────
def ingest_source(
    api_key: str,
    series_id: str,
    source_type: str,
    title: str,
    raw_content: str,
    source_id: Optional[str] = None,
) -> dict:
    """
    소스 1건 → source/{series_id}/ 저장 + wiki/{series_id}/ 갱신.
    Gemini 호출 1회.
    """
    _ensure_dirs(series_id)
    import uuid
    sid = source_id or str(uuid.uuid4())[:8]

    # 1) source/{series_id}/ 에 원본 보존
    src_path = _series_source_dir(series_id) / _source_filename(sid, source_type, title)
    header = f"---\nid: {sid}\ntype: {source_type}\ntitle: {title}\nsaved_at: {datetime.now().isoformat()}\n---\n\n"
    _write(src_path, header + raw_content)

    # 2) 기존 페이지 목록 (summary만 전달 — 토큰 절약)
    existing = [
        {"slug": p["slug"], "page_type": _guess_page_type(p["slug"]), "summary": p["summary"]}
        for p in list_wiki_pages(series_id)
    ]

    user_content = json.dumps({
        "series_id": series_id,
        "source": {"id": sid, "source_type": source_type, "title": title, "raw_content": raw_content},
        "existing_pages": existing,
        "wiki_schema": load_schema(),
    }, ensure_ascii=False, indent=2)

    raw = _call_gemini(api_key, load_prompt("ingest"), user_content, max_tokens=4096)

    try:
        result = _extract_json(raw)
    except Exception as e:
        _log(series_id, "ingest_error", title, f"JSON 파싱 실패: {e}")
        return {"error": str(e), "raw": raw[:500]}

    patches = result.get("patches", [])
    created, updated = [], []

    # 3) 패치 적용
    for patch in patches:
        slug = patch.get("slug", "")
        if not slug:
            continue
        kind    = patch.get("patch_kind", "create")
        content = patch.get("content_md", "")
        path    = _slug_to_path(series_id, slug)

        if kind == "create" or not path.exists():
            _write(path, content)
            created.append(slug)
        elif kind == "append":
            existing_content = _read(path)
            # 동일 소스ID가 이미 기록된 경우 중복 append 방지
            marker = f"<!-- src:{sid} -->"
            if marker in existing_content:
                continue
            _append(path, f"\n<!-- src:{sid} -->\n" + content)
            updated.append(slug)
        elif kind == "replace":
            _write(path, content)
            updated.append(slug)

    # 4) index + log
    _update_index(series_id, result.get("index_additions", []))
    log_entry = result.get("log_entry") or f"## [{datetime.now().strftime('%Y-%m-%d %H:%M')}] ingest | {title}"
    _append(_series_log(series_id), "\n" + log_entry + "\n")
    _append(LOG_MD, f"\n## [{datetime.now().strftime('%Y-%m-%d %H:%M')}] [{series_id}] ingest | {title}\n")

    return {
        "series_id": series_id,
        "source_id": sid,
        "source_file": str(src_path),
        "patches_applied": len(patches),
        "pages_created": created,
        "pages_updated": updated,
    }


def _guess_page_type(slug: str) -> str:
    if slug.startswith("character_arcs/"): return "character_arc"
    return {
        "world": "world", "relationships": "relationship",
        "timeline": "timeline", "foreshadows": "foreshadow",
        "facts": "fact", "props": "prop", "theme": "theme",
    }.get(slug, "fact")


# ── 챕터 완료 후 자동 ingest ──────────────────────────────────────────────────
def ingest_chapter(api_key: str, series_id: str, chapter: int, content: str) -> dict:
    """챕터 대본 완성 후 위키 자동 갱신 (character_arcs, timeline, foreshadows)
    중복 ingest 방지: source/{series_id}/ch{N}__chapter__*.md 존재 시 스킵
    """
    source_id = f"ch{str(chapter).zfill(2)}"
    src_dir = _series_source_dir(series_id)
    existing = list(src_dir.glob(f"{source_id}__chapter__*.md"))
    if existing:
        print(f"[wiki] ch{chapter} 이미 ingest됨 → 스킵 ({existing[0].name})")
        return {"series_id": series_id, "skipped": True, "reason": f"ch{chapter} already ingested"}
    return ingest_source(
        api_key=api_key,
        series_id=series_id,
        source_type="chapter",
        title=f"챕터 {chapter} 대본",
        raw_content=content,
        source_id=source_id,
    )


# ── 오퍼레이션 2: QUERY ────────────────────────────────────────────────────────
_STUB_THRESHOLD = 80  # 이 바이트 이하는 초기화 stub으로 간주


def _has_accumulated_content(pages: list[dict]) -> bool:
    """
    character_arcs 중 하나라도 실질 내용(stub 초과)이 있으면 True.
    1챕터 cold-start 판별: False면 NLM 폴백 유지.
    """
    for p in pages:
        if p["slug"].startswith("character_arcs/") and len(p["content_md"]) > _STUB_THRESHOLD:
            return True
    return False


def build_chapter_context(
    series_id: str,
    chapter_role: str,
    token_budget: int = 6000,
) -> str:
    """
    wiki/{series_id}/ 를 읽어 챕터 역할에 맞는 컨텍스트 반환.
    Gemini 호출 없음.

    Cold-start 판별: character_arcs 모두 stub(≤80자)이면 ""반환 → NLM 폴백.
    이미 ingest된 챕터가 있을 때만 위키 컨텍스트 주입.
    """
    pages = list_wiki_pages(series_id)
    if not pages:
        return ""

    # 축적된 스토리 내용이 없으면 NLM 폴백에 맡김 (1챕터 cold-start)
    if not _has_accumulated_content(pages):
        print(f"[wiki] cold-start detected ({series_id}) → NLM 폴백")
        return ""

    schema = load_schema()
    sel = schema["operations"]["query"]["context_selection"]
    always_p = sel.get("always_include", [])
    role_p   = sel.get(chapter_role, [])

    def priority(p: dict) -> int:
        s = p["slug"]
        for pat in always_p:
            if _matches(s, pat): return 0
        for pat in role_p:
            if _matches(s, pat): return 1
        return 2

    selected, total = [], 0
    for page in sorted(pages, key=priority):
        content = page["content_md"]
        # stub 페이지(초기화만 된 빈 파일) 제외
        if len(content) <= _STUB_THRESHOLD:
            continue
        if total + len(content) > token_budget:
            content = page["summary"][:200]
        if not content.strip():
            continue
        selected.append({"slug": page["slug"], "content": content})
        total += len(content)
        if len(selected) >= 7:
            break

    if not selected:
        return ""

    lines = [f"=== WIKI CONTEXT ({series_id}) ===\n"]
    for item in selected:
        lines.append(f"### [[{item['slug']}]]\n{item['content']}\n")
    lines.append("=== END WIKI CONTEXT ===")
    return "\n".join(lines)


def _matches(slug: str, pattern: str) -> bool:
    if pattern.endswith("/*"):
        return slug.startswith(pattern[:-2] + "/")
    return slug == pattern


# ── 오퍼레이션 3: LINT ────────────────────────────────────────────────────────
def run_lint(api_key: str, series_id: str, recent_chapter_count: int = 3) -> str:
    """위키 건강성 점검 → wiki/{series_id}/lint_report.md 저장"""
    _ensure_dirs(series_id)
    pages = list_wiki_pages(series_id)

    recent_chapters = []
    src_dir = _series_source_dir(series_id)
    for src_file in sorted(src_dir.glob("ch*__chapter__*.md"), reverse=True)[:recent_chapter_count]:
        content = src_file.read_text(encoding="utf-8")
        m = re.search(r"ch(\d+)", src_file.stem)
        ch = int(m.group(1)) if m else 0
        recent_chapters.append({"chapter": ch, "content": content[:3000]})

    user_content = json.dumps({
        "series_id": series_id,
        "all_pages": [
            {"slug": p["slug"], "content_md": p["content_md"][:2000], "updated_at": p["updated_at"]}
            for p in pages
        ],
        "recent_chapters": recent_chapters,
        "log_md": _read(_series_log(series_id))[-2000:],
    }, ensure_ascii=False, indent=2)

    report = _call_gemini(api_key, load_prompt("lint"), user_content, max_tokens=4096)
    _write(_series_wiki_dir(series_id) / "lint_report.md", report)
    _log(series_id, "lint", "건강성 점검", f"페이지 {len(pages)}개, 챕터 {len(recent_chapters)}개 검수")
    return report


# ── Cold Start: 세계관에서 초기 위키 생성 ─────────────────────────────────────
def init_wiki_from_world(series_id: str, world: dict):
    """
    시리즈 생성 직후 world dict → wiki/{series_id}/ 초기 파일 생성.
    Gemini 호출 없음.
    """
    _ensure_dirs(series_id)

    # world.md — 세계관 + 캐릭터 정보 통합 (characters/ 폴더 불필요)
    char_sections = ""
    index_lines = ["\n## world\n- [[world]] — 시리즈 세계관"]
    for prefix, name_key in [("charA", "charAName"), ("charB", "charBName")]:
        name = world.get(name_key) or world.get(f"{prefix}Name", "")
        if not name:
            continue
        char_id = world.get(f"{prefix}Id", "")
        char_sections += f"""

## 캐릭터: {name}{f' (ID: {char_id})' if char_id else ''}
- 나이: {world.get(f'{prefix}Age', '')}
- 직업: {world.get(f'{prefix}Job', '')}
- Want: {world.get(f'{prefix}Want', '')}
- Need: {world.get(f'{prefix}Need', '')}
- 비밀: {world.get(f'{prefix}Secret', '')}
- 말투: {world.get(f'{prefix}SpeakingStyle', '')}"""
        _write(_series_wiki_dir(series_id) / "character_arcs" / f"{name}.md",
               f"# {name} — 챕터별 변화\n\n")

    _write(_series_wiki_dir(series_id) / "world.md", f"""# 세계관

## 기본 설정
- 주제: {world.get('topic', '')}
- 장르: {world.get('genre', '')}
- 문체: {world.get('style', '')}

## 핵심 관계
{world.get('relationship', '')}

## 갈등 유형
{world.get('conflictType', '')}

## 감정선
{world.get('emotionLines', '')}
{char_sections}
""".strip())

    # foreshadows.md / timeline.md / facts.md / theme.md
    _write(_series_wiki_dir(series_id) / "foreshadows.md",
           "# 복선 추적\n\n## 심어진 복선\n\n## 회수된 복선\n\n## 미회수 복선\n")
    _write(_series_wiki_dir(series_id) / "timeline.md",
           "# 사건 타임라인\n\n## 챕터별 사건 목록\n")
    _write(_series_wiki_dir(series_id) / "facts.md",
           "# 팩트 데이터\n\n## 핵심 팩트\n\n## 출처\n\n## 대본 활용 포인트\n")
    _write(_series_wiki_dir(series_id) / "theme.md",
           f"# 주제의식\n\n{world.get('subject', world.get('topic', ''))}\n")

    # index 갱신
    arc_lines = [
        f"- [[character_arcs/{world.get(k) or world.get(f'{p}Name', '')}]] — 챕터별 변화"
        for p, k in [("charA","charAName"),("charB","charBName")]
        if (world.get(k) or world.get(f"{p}Name",""))
    ]
    index_lines += [
        "\n## character_arc",
        *arc_lines,
        "\n## foreshadow\n- [[foreshadows]] — 복선 추적",
        "\n## timeline\n- [[timeline]] — 사건 타임라인",
        "\n## fact\n- [[facts]] — 팩트 데이터",
        "\n## theme\n- [[theme]] — 주제의식\n",
    ]
    _update_index(series_id, index_lines)

    # 전체 index.md 에도 시리즈 등록
    series_entry = f"- [{series_id}](wiki/{_safe_id(series_id)}/index.md) — {world.get('topic','')}"
    current_global = _read(INDEX_MD)
    if series_entry not in current_global:
        _append(INDEX_MD, f"\n{series_entry}\n")

    _log(series_id, "rebuild", f"초기화 | {world.get('topic','')}")
    print(f"[wiki] 초기화 완료 → {_series_wiki_dir(series_id)}")
