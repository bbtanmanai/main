"""
Wiki 라우터 — LLM Wiki 로컬 파일 기반
저장소: C:/LinkDropV2/source/{series_id}/  +  C:/LinkDropV2/wiki/{series_id}/
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional
import os

from services.wiki_service import (
    ingest_source,
    ingest_chapter,
    build_chapter_context,
    run_lint,
    init_wiki_from_world,
    list_wiki_pages,
    read_wiki_page,
    write_wiki_page,
    append_wiki_page,
    delete_wiki_page,
    INDEX_MD,
    LOG_MD,
    _series_index,
    _series_log,
    _read,
)

router = APIRouter(prefix="/api/v1/wiki", tags=["wiki"])


def _api_key(key: str = "") -> str:
    return key or os.environ.get("GOOGLE_API_KEY", "")


# ── 모델 ──────────────────────────────────────────────────────────────────────

class InitRequest(BaseModel):
    series_id: str
    world: dict


class IngestRequest(BaseModel):
    series_id: str
    source_type: str        # url | text | nlm_query | chapter | user_note
    title: str
    raw_content: str
    source_id: Optional[str] = None
    api_key: str = ""


class IngestChapterRequest(BaseModel):
    series_id: str
    chapter: int
    content: str
    api_key: str = ""


class WritePageRequest(BaseModel):
    content_md: str


class AppendPageRequest(BaseModel):
    content_md: str


class LintRequest(BaseModel):
    series_id: str
    api_key: str = ""
    recent_chapter_count: int = 3


class ContextRequest(BaseModel):
    series_id: str
    chapter_role: str       # 도입부 | 전개 | 클라이맥스 | 결말
    token_budget: int = 6000


# ── 엔드포인트 ────────────────────────────────────────────────────────────────

@router.post("/init")
async def init_wiki(req: InitRequest):
    """세계관에서 wiki/{series_id}/ 초기 파일 생성 (Gemini 0회)"""
    init_wiki_from_world(req.series_id, req.world)
    pages = list_wiki_pages(req.series_id)
    return {
        "ok": True,
        "series_id": req.series_id,
        "pages_created": [p["slug"] for p in pages],
    }


@router.post("/sources/ingest")
async def ingest(req: IngestRequest, background_tasks: BackgroundTasks):
    """소스 1건 → source/{series_id}/ 저장 + wiki/{series_id}/ 갱신 (백그라운드)"""
    key = _api_key(req.api_key)
    if not key:
        raise HTTPException(400, "API key required")

    def _run():
        try:
            r = ingest_source(key, req.series_id, req.source_type, req.title, req.raw_content, req.source_id)
            print(f"[wiki/ingest] {req.series_id}: {r}")
        except Exception as e:
            print(f"[wiki/ingest] 오류: {e}")

    background_tasks.add_task(_run)
    return {"ok": True, "status": "processing", "series_id": req.series_id, "title": req.title}


@router.post("/sources/ingest-chapter")
async def ingest_chapter_ep(req: IngestChapterRequest, background_tasks: BackgroundTasks):
    """챕터 대본 완성 후 character_arcs/timeline/foreshadows 자동 갱신 (백그라운드)"""
    key = _api_key(req.api_key)
    if not key:
        raise HTTPException(400, "API key required")

    def _run():
        try:
            r = ingest_chapter(key, req.series_id, req.chapter, req.content)
            print(f"[wiki/ingest-chapter] ch{req.chapter}: {r}")
        except Exception as e:
            print(f"[wiki/ingest-chapter] 오류: {e}")

    background_tasks.add_task(_run)
    return {"ok": True, "status": "processing", "series_id": req.series_id, "chapter": req.chapter}


@router.get("/{series_id}/pages")
async def get_pages(series_id: str):
    """wiki/{series_id}/ 페이지 목록"""
    pages = list_wiki_pages(series_id)
    return {"series_id": series_id, "pages": [
        {"slug": p["slug"], "title": p["title"], "summary": p["summary"], "updated_at": p["updated_at"]}
        for p in pages
    ]}


@router.get("/{series_id}/pages/{slug:path}")
async def get_page(series_id: str, slug: str):
    """특정 wiki 페이지 내용"""
    content = read_wiki_page(series_id, slug)
    if content is None:
        raise HTTPException(404, f"Page not found: {slug}")
    return {"series_id": series_id, "slug": slug, "content_md": content}


@router.put("/{series_id}/pages/{slug:path}")
async def update_page(series_id: str, slug: str, req: WritePageRequest):
    """위키 페이지 수동 편집 (전체 교체)"""
    write_wiki_page(series_id, slug, req.content_md)
    return {"ok": True, "series_id": series_id, "slug": slug}


@router.post("/{series_id}/pages/{slug:path}/append")
async def append_page(series_id: str, slug: str, req: AppendPageRequest):
    """위키 페이지 끝에 내용 추가"""
    append_wiki_page(series_id, slug, req.content_md)
    return {"ok": True, "series_id": series_id, "slug": slug}


@router.delete("/{series_id}/pages/{slug:path}")
async def delete_page(series_id: str, slug: str):
    """위키 페이지 삭제"""
    content = read_wiki_page(series_id, slug)
    if content is None:
        raise HTTPException(404, f"Page not found: {slug}")
    delete_wiki_page(series_id, slug)
    return {"ok": True, "series_id": series_id, "slug": slug}


@router.get("/{series_id}/index")
async def get_series_index(series_id: str):
    """wiki/{series_id}/index.md"""
    return {"content": _read(_series_index(series_id))}


@router.get("/{series_id}/log")
async def get_series_log(series_id: str):
    """wiki/{series_id}/log.md 최근 100줄"""
    lines = _read(_series_log(series_id)).splitlines()
    return {"content": "\n".join(lines[-100:])}


@router.post("/context")
async def get_context(req: ContextRequest):
    """챕터 역할별 위키 컨텍스트 미리보기"""
    context = build_chapter_context(req.series_id, req.chapter_role, req.token_budget)
    return {
        "series_id": req.series_id,
        "context": context,
        "char_count": len(context),
        "has_wiki": len(context) > 0,
    }


@router.post("/lint")
async def lint(req: LintRequest):
    """위키·대본 건강성 점검 → wiki/{series_id}/lint_report.md 저장"""
    key = _api_key(req.api_key)
    if not key:
        raise HTTPException(400, "API key required")
    report = run_lint(key, req.series_id, req.recent_chapter_count)
    return {"series_id": req.series_id, "report": report}


@router.get("/global/index")
async def get_global_index():
    """전체 시리즈 목차 (wiki/index.md)"""
    return {"content": _read(INDEX_MD)}


@router.get("/global/log")
async def get_global_log():
    """전체 작업 기록 최근 200줄"""
    lines = _read(LOG_MD).splitlines()
    return {"content": "\n".join(lines[-200:])}
