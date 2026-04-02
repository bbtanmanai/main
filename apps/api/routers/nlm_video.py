from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import json
import re
import time
import os
from pathlib import Path

from notebooklm_tools import NotebookLMClient
from notebooklm_tools.cli.utils import get_client

router = APIRouter(prefix="/api/v1/nlm-video", tags=["NLM Video"])

# In-memory job store (local dev)
_jobs: Dict[str, Dict[str, Any]] = {}

# ── 노트앱 라우팅 맵 ──────────────────────────────────────────────────────────
NICHE_NOTEBOOK_MAP: Dict[str, Dict[str, str]] = {
    "경제·재테크":  {"id": "85362656-b5a6-4672-a874-619b99fc55e5", "name": "[LD] 경제·재테크"},
    "부동산·투자":  {"id": "a8891e02-4fc9-4593-8fc7-fb13333ea6a7", "name": "[LD] 부동산·투자"},
    "건강·의학":    {"id": "9d3c21fe-e9e5-41a8-8c67-eed5090f799a", "name": "[LD] 건강·의학"},
    "자기계발·심리": {"id": "6a6dee66-1811-4939-80cc-4ab57f50810b", "name": "[LD] 자기계발·심리"},
    "웹소설":       {"id": "a879a2d9-8cb2-4182-b14a-b04dcc49d448", "name": "[LD] 웹소설"},
}
NICHE_DEFAULT = "경제·재테크"  # 분류 불가 시 폴백

VIDEO_STYLE_MAP = {
    "AUTO_SELECT": NotebookLMClient.VIDEO_STYLE_AUTO_SELECT,
    "CLASSIC":     NotebookLMClient.VIDEO_STYLE_CLASSIC,
    "WHITEBOARD":  NotebookLMClient.VIDEO_STYLE_WHITEBOARD,
    "KAWAII":      NotebookLMClient.VIDEO_STYLE_KAWAII,
    "ANIME":       NotebookLMClient.VIDEO_STYLE_ANIME,
    "WATERCOLOR":  NotebookLMClient.VIDEO_STYLE_WATERCOLOR,
    "RETRO_PRINT": NotebookLMClient.VIDEO_STYLE_RETRO_PRINT,
    "HERITAGE":    NotebookLMClient.VIDEO_STYLE_HERITAGE,
    "PAPER_CRAFT": NotebookLMClient.VIDEO_STYLE_PAPER_CRAFT,
}

VIDEO_FORMAT_MAP = {
    "EXPLAINER": NotebookLMClient.VIDEO_FORMAT_EXPLAINER,
    "BRIEF":     NotebookLMClient.VIDEO_FORMAT_BRIEF,
}


# ── Pydantic Models ───────────────────────────────────────────────────────────

class InitRequest(BaseModel):
    urls: Optional[List[str]] = None
    text_content: Optional[str] = None   # STT 텍스트 직접 주입
    notebook_name: str = "LinkDrop 채널 분석"
    existing_notebook_id: Optional[str] = None  # 기존 노트북 재사용

class AnalyzeRequest(BaseModel):
    notebook_id: str

class SuggestNamesRequest(BaseModel):
    notebook_id: str
    niche: str = ""      # 분석 결과 → 채널명 프롬프트에 맥락으로 주입
    target: str = ""     # 분석 결과 → 타겟 시청자 기반 채널명

class SuggestTopicsRequest(BaseModel):
    notebook_id: str
    channel_name: str
    title_pattern: str = ""  # 분석 결과 → 검증된 제목 공식 적용
    hook: str = ""           # 분석 결과 → 오프닝 훅 패턴 적용

class CreateVideoRequest(BaseModel):
    notebook_id: str
    topic: str
    style: str = "AUTO_SELECT"
    format: str = "EXPLAINER"

class WhisperRequest(BaseModel):
    audio_path: str

class GenerateIdeasRequest(BaseModel):
    notebook_id: str
    analysis: Optional[Dict[str, Any]] = None
    count: int = 20
    raw_content: str = ""
    video_title: str = ""

class GenerateScriptRequest(BaseModel):
    notebook_id: str
    idea: str
    prompt: str

class InjectPromptRequest(BaseModel):
    notebook_id: str
    prompt: str

class ClassifySourceRequest(BaseModel):
    title: str = ""
    text_snippet: str = ""   # SRT 앞 300자 또는 영상 설명
    api_key: str = ""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_json_from_text(text: str) -> Any:
    """NLM 응답에서 JSON 추출 (마크다운 코드블록 포함 대응)"""
    text = re.sub(r'```(?:json)?\s*', '', text).strip().rstrip('`').strip()
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r'(\[[\s\S]*?\]|\{[\s\S]*?\})', text)
        if m:
            try:
                return json.loads(m.group(1))
            except Exception:
                pass
    return None


def _clean_nlm_text(text: str) -> str:
    """NLM 출력 정제: 인용번호 + 마크다운 문법 제거"""
    # 인용 번호: [3], [3, 4], [1, 2, 3]
    text = re.sub(r'\[\d+(?:,\s*\d+)*\]', '', text)
    # 헤더: ## 제목 → 제목
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    # 굵게/기울임: **텍스트** or __텍스트__ or *텍스트* or _텍스트_
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'__(.+?)__', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'_(.+?)_', r'\1', text)
    # 인라인 코드: `코드`
    text = re.sub(r'`(.+?)`', r'\1', text)
    # 수평선: --- or ***
    text = re.sub(r'^[-*]{3,}\s*$', '', text, flags=re.MULTILINE)
    # 연속 공백/줄바꿈 정리
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def _extract_answer(result: Any) -> str:
    if result is None:
        return ""
    if isinstance(result, dict):
        raw = result.get("answer") or result.get("text") or result.get("content") or str(result)
    else:
        raw = str(result)
    return _clean_nlm_text(raw)


# ── Sync Workers (run via asyncio.to_thread) ──────────────────────────────────

def _sync_clear_sources(notebook_id: str) -> Dict[str, Any]:
    """노트북 내 모든 소스를 일괄 삭제"""
    with get_client() as client:
        sources = client.get_notebook_sources_with_types(notebook_id) or []
        if not sources:
            print(f">>> [NLM] No sources to clear in {notebook_id}")
            return {"cleared": 0}

        source_ids = [s["id"] for s in sources if s.get("id")]
        if not source_ids:
            return {"cleared": 0}

        print(f">>> [NLM] Clearing {len(source_ids)} sources from {notebook_id}")
        client.delete_sources(source_ids)
        print(f">>> [NLM] Cleared {len(source_ids)} sources OK")
        return {"cleared": len(source_ids)}


def _sync_init_notebook(
    notebook_name: str,
    urls: Optional[List[str]] = None,
    text_content: Optional[str] = None,
    existing_notebook_id: Optional[str] = None,
) -> Dict[str, Any]:
    with get_client() as client:
        if existing_notebook_id:
            notebook_id = existing_notebook_id
            notebook_url = f"https://notebooklm.google.com/notebook/{notebook_id}"
            print(f">>> [NLM] Reusing existing notebook: {notebook_id} (sources accumulate)")
        else:
            nb = client.create_notebook(title=notebook_name)
            notebook_id = nb.id
            notebook_url = nb.url
        first_id = None

        if text_content:
            print(f">>> [NLM] Adding text source ({len(text_content)}자) to {notebook_id}")
            source = client.add_text_source(notebook_id, text_content, title=notebook_name, wait=False)
            if source:
                first_id = (source or {}).get("id") or (source or {}).get("source_id")

        elif urls:
            batch = urls[:20]
            print(f">>> [NLM] Adding {len(batch)} URL sources to notebook {notebook_id}")
            sources = client.add_url_sources(notebook_id, batch, wait=False)
            if sources:
                first_id = (sources[0] or {}).get("id") or (sources[0] or {}).get("source_id")

        if first_id:
            try:
                client.wait_for_source_ready(notebook_id, first_id, timeout=120.0)
            except Exception as e:
                print(f">>> [NLM] wait_for_source_ready warning: {e}")

        return {"notebook_id": notebook_id, "notebook_url": notebook_url}


def _sync_query(notebook_id: str, prompt: str) -> str:
    with get_client() as client:
        result = client.query(notebook_id, prompt, timeout=120.0)
        return _extract_answer(result)


def _sync_create_video(notebook_id: str, topic: str, style_code: int, format_code: int) -> Any:
    with get_client() as client:
        return client.create_video_overview(
            notebook_id,
            format_code=format_code,
            visual_style_code=style_code,
            focus_prompt=topic,
        )


def _sync_poll_studio(notebook_id: str) -> list:
    with get_client() as client:
        return client.poll_studio_status(notebook_id) or []


def _sync_download_video(notebook_id: str, output_path: str, artifact_id: Optional[str]) -> str:
    with get_client() as client:
        return client.download_video(notebook_id, output_path, artifact_id=artifact_id)


# ── Background Task ───────────────────────────────────────────────────────────

async def _bg_create_video(notebook_id: str, topic: str, style_code: int, format_code: int):
    job = _jobs[notebook_id]
    try:
        job["status"] = "creating"
        job["progress"] = 10

        # 1. 영상 생성 요청
        result = await asyncio.to_thread(
            _sync_create_video, notebook_id, topic, style_code, format_code
        )
        print(f">>> [NLM VIDEO] create result: {result}")

        artifact_id = None
        if isinstance(result, dict):
            artifact_id = result.get("id") or result.get("artifact_id") or result.get("studio_id")
        elif result is not None:
            artifact_id = str(result)

        job["artifact_id"] = artifact_id
        job["status"] = "processing"
        job["progress"] = 20

        # 2. 완료 대기 (최대 6분)
        deadline = time.time() + 360
        while time.time() < deadline:
            studios = await asyncio.to_thread(_sync_poll_studio, notebook_id)
            for s in studios:
                state = str(s.get("state") or s.get("status") or "").upper()
                if "COMPLETE" in state or "DONE" in state or "READY" in state or "SUCCESS" in state:
                    job["progress"] = 90
                    job["status"] = "downloading"
                    artifact_id = s.get("id") or s.get("artifact_id") or artifact_id
                    break
                if "ERROR" in state or "FAIL" in state:
                    raise RuntimeError(f"NLM video generation failed: {s}")
            else:
                # 완료 신호 없으면 계속 대기
                elapsed = int((time.time() - (deadline - 360)) / 36)
                job["progress"] = min(20 + elapsed * 7, 88)
                await asyncio.sleep(6)
                continue
            break  # 완료

        # 3. 다운로드
        output_dir = Path(__file__).resolve().parents[3] / "tmp" / "nlm_videos"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = str(output_dir / f"{notebook_id[:12]}.mp4")

        final_path = await asyncio.to_thread(
            _sync_download_video, notebook_id, output_path, artifact_id
        )

        job["status"] = "done"
        job["progress"] = 100
        job["output_path"] = final_path or output_path

    except Exception as e:
        import traceback
        print(f">>> [NLM VIDEO] Error: {traceback.format_exc()}")
        job["status"] = "error"
        job["error"] = str(e)


async def _classify_niche_gemini(title: str, text_snippet: str, api_key: str) -> str:
    """Gemini Flash로 소스 텍스트 → 노트앱 카테고리 분류"""
    from google import genai

    categories = " / ".join(NICHE_NOTEBOOK_MAP.keys()) + " / 기타"
    prompt = f"""아래 텍스트가 어떤 주제인지 판단해서 카테고리 1개만 골라라.

선택지: {categories}

규칙:
- 반드시 선택지 중 하나만 정확히 그대로 출력
- 확신이 없거나 여러 카테고리에 걸치면 "기타" 선택
- 웹소설/로맨스/판타지/소설 추천 관련이면 "웹소설"
- 주식/ETF/절약/월급/경제 관련이면 "경제·재테크"
- 아파트/청약/임대/토지 관련이면 "부동산·투자"
- 다이어트/운동/질병/의학/건강 관련이면 "건강·의학"
- 습관/독서/생산성/심리/자기계발 관련이면 "자기계발·심리"

JSON만 출력: {{"niche": "선택값"}}

제목: {title}
내용: {text_snippet[:300]}"""

    try:
        client = genai.Client(api_key=api_key)
        response = await asyncio.to_thread(
            client.models.generate_content,
            model="gemini-2.0-flash",
            contents=prompt,
        )
        raw = response.text.strip()
        raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
        raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE)
        parsed = json.loads(raw)
        niche = parsed.get("niche", "").strip()
        if niche not in NICHE_NOTEBOOK_MAP:
            return NICHE_DEFAULT
        return niche
    except Exception as e:
        print(f">>> [Classify] Gemini 분류 실패: {e}")
        return NICHE_DEFAULT


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/classify-source")
async def classify_source(req: ClassifySourceRequest):
    """소스 제목+내용 → 카테고리 분류 + 주입할 노트앱 ID 반환"""
    effective_key = req.api_key.strip() or os.environ.get("GOOGLE_API_KEY", "")
    if not effective_key:
        # API 키 없으면 기본값 반환
        info = NICHE_NOTEBOOK_MAP[NICHE_DEFAULT]
        return {"success": True, "niche": NICHE_DEFAULT, "notebook_id": info["id"], "notebook_name": info["name"]}
    try:
        niche = await _classify_niche_gemini(req.title, req.text_snippet, effective_key)
        info = NICHE_NOTEBOOK_MAP[niche]
        return {"success": True, "niche": niche, "notebook_id": info["id"], "notebook_name": info["name"]}
    except Exception as e:
        info = NICHE_NOTEBOOK_MAP[NICHE_DEFAULT]
        return {"success": True, "niche": NICHE_DEFAULT, "notebook_id": info["id"], "notebook_name": info["name"]}


@router.get("/notebooks")
async def list_notebooks():
    """등록된 노트앱 목록 반환"""
    return {
        "success": True,
        "notebooks": [
            {"niche": niche, "notebook_id": v["id"], "notebook_name": v["name"]}
            for niche, v in NICHE_NOTEBOOK_MAP.items()
        ]
    }


@router.post("/init-notebook")
async def init_notebook(req: InitRequest):
    """URL 목록 또는 텍스트 → NLM 노트북 생성 + 소스 주입"""
    if not req.urls and not req.text_content:
        raise HTTPException(status_code=400, detail="urls 또는 text_content가 필요합니다.")
    try:
        result = await asyncio.to_thread(
            _sync_init_notebook,
            req.notebook_name,
            req.urls,
            req.text_content,
            req.existing_notebook_id,
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear-sources")
async def clear_sources(req: AnalyzeRequest):
    """노트북 내 모든 소스 수동 삭제 (notebook_id 필요)"""
    try:
        result = await asyncio.to_thread(_sync_clear_sources, req.notebook_id)
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_channel(req: AnalyzeRequest):
    """채널 분석: 틈새시장 / 대본스타일 / 제목패턴 / 톤 / 타겟 / 훅"""
    prompt = (
        "제공된 영상 소스들을 전체 교차 분석해서 아래 6가지를 JSON으로만 반환해줘. "
        "표면적 설명이 아니라 소스 전체에서 반복되는 실제 패턴을 찾아줘. "
        "다른 설명 없이 JSON 객체만 출력해:\n"
        "{"
        '"niche":"이 채널만의 틈새시장. 비슷한 채널과 차별화되는 핵심 포인트 1가지 (2문장)",'
        '"style":"대본 구성 방식. 오프닝 훅→전개→마무리의 실제 패턴 (2문장)",'
        '"title_pattern":"조회수 높을 것으로 보이는 영상들의 제목 공식. 숫자/의문형/충격형 등 구체적 패턴 (2문장)",'
        '"tone":"말투와 감정선. 시청자와의 관계 설정 방식 (2문장)",'
        '"target":"핵심 타겟 시청자. 연령대·관심사·주요 고민 구체적으로 (2문장)",'
        '"hook":"영상 초반 반복적으로 등장하는 오프닝 훅 패턴 2~3가지 (2문장)"'
        "}"
    )
    try:
        text = await asyncio.to_thread(_sync_query, req.notebook_id, prompt)
        data = _parse_json_from_text(text)
        if data and isinstance(data, dict):
            clean = {k: _clean_nlm_text(v) if isinstance(v, str) else v for k, v in data.items()}
            return {"success": True, "analysis": clean}
        return {"success": True, "analysis": {"niche": _clean_nlm_text(text), "style": "", "title_pattern": "", "tone": ""}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-names")
async def suggest_names(req: SuggestNamesRequest):
    """분석 결과 기반 한글 채널명 20개 생성"""
    context = ""
    if req.niche:
        context += f"이 채널의 핵심 틈새시장: {req.niche}\n"
    if req.target:
        context += f"핵심 타겟 시청자: {req.target}\n"

    prompt = (
        f"{context}"
        "위 채널의 핵심 가치와 타겟 시청자를 바탕으로, "
        "한국 유튜브에서 검색되고 기억되기 쉬운 채널명을 두 단어 이내로 20개 만들어줘. "
        "조건: 타겟 시청자가 보자마자 '나를 위한 채널'이라고 느낄 수 있는 이름. "
        "의성어·숫자·감정 단어 활용 가능. "
        "다른 설명 없이 JSON 배열만 출력해:\n"
        '["채널명1","채널명2",...]'
    )
    try:
        text = await asyncio.to_thread(_sync_query, req.notebook_id, prompt)
        data = _parse_json_from_text(text)
        if isinstance(data, list):
            return {"success": True, "names": [str(n) for n in data[:20]]}
        names = [l.strip().lstrip('-•·0123456789.').strip() for l in text.split('\n') if l.strip()]
        return {"success": True, "names": [n for n in names if n][:20]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-topics")
async def suggest_topics(req: SuggestTopicsRequest):
    """분석된 제목 공식 + 훅 패턴 기반 실제 영상 제목 10개 생성"""
    context = ""
    if req.title_pattern:
        context += f"이 채널의 검증된 제목 공식: {req.title_pattern}\n"
    if req.hook:
        context += f"반복되는 오프닝 훅 패턴: {req.hook}\n"

    prompt = (
        f"{context}"
        f"'{req.channel_name}' 채널에서 만들 수 있는 영상 제목 10개를 추천해줘. "
        "조건: "
        "1) 위에서 분석된 이 채널의 실제 제목 공식을 그대로 적용할 것. "
        "2) 주제가 아니라 실제 업로드할 영상 제목 형태로 출력. "
        "3) 시청자가 클릭하고 싶어지는 훅(숫자·의문·충격·공감) 포함. "
        "4) 소스에서 확인된 이 채널 시청자의 주요 고민·관심사를 반영. "
        "다른 설명 없이 JSON 배열만 출력해:\n"
        '["제목1","제목2",...]'
    )
    try:
        text = await asyncio.to_thread(_sync_query, req.notebook_id, prompt)
        data = _parse_json_from_text(text)
        if isinstance(data, list):
            return {"success": True, "topics": [str(t) for t in data[:10]]}
        topics = [l.strip().lstrip('-•·0123456789.').strip() for l in text.split('\n') if l.strip()]
        return {"success": True, "topics": [t for t in topics if t][:10]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-video")
async def create_video(req: CreateVideoRequest, background_tasks: BackgroundTasks):
    """영상 생성 시작 (백그라운드)"""
    style_code = VIDEO_STYLE_MAP.get(req.style, NotebookLMClient.VIDEO_STYLE_AUTO_SELECT)
    format_code = VIDEO_FORMAT_MAP.get(req.format, NotebookLMClient.VIDEO_FORMAT_EXPLAINER)

    _jobs[req.notebook_id] = {
        "status": "queued",
        "progress": 0,
        "notebook_id": req.notebook_id,
        "topic": req.topic,
        "artifact_id": None,
        "output_path": None,
        "error": None,
    }
    background_tasks.add_task(
        _bg_create_video, req.notebook_id, req.topic, style_code, format_code
    )
    return {"success": True, "job_id": req.notebook_id}


@router.get("/video-status/{notebook_id}")
async def get_video_status(notebook_id: str):
    """영상 생성 진행 상태 조회"""
    job = _jobs.get(notebook_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/download/{notebook_id}")
async def download_video(notebook_id: str):
    """완성된 영상 파일 다운로드"""
    job = _jobs.get(notebook_id)
    if not job or job.get("status") != "done":
        raise HTTPException(status_code=404, detail="영상이 아직 준비되지 않았습니다.")
    path = job.get("output_path")
    if not path or not Path(path).exists():
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    return FileResponse(path, media_type="video/mp4", filename=f"linkdrop_{notebook_id[:8]}.mp4")


# ── 신규: STT / 아이디어 / 대본 ────────────────────────────────────────────────

def _sync_whisper_stt(audio_path: str) -> str:
    """faster-whisper로 오디오 → 텍스트 변환 (동기)"""
    from faster_whisper import WhisperModel
    model = WhisperModel("base", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(audio_path, language="ko")
    return " ".join(seg.text.strip() for seg in segments)


@router.post("/whisper-stt")
async def whisper_stt(req: WhisperRequest):
    """오디오 파일 → Whisper STT → 텍스트"""
    if not Path(req.audio_path).exists():
        raise HTTPException(status_code=400, detail=f"오디오 파일 없음: {req.audio_path}")
    try:
        text = await asyncio.to_thread(_sync_whisper_stt, req.audio_path)
        return {"success": True, "text": text, "length": len(text)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-ideas")
async def generate_ideas(req: GenerateIdeasRequest):
    """채널 분석 결과 기반 독창적 영상 아이디어 20개 생성"""
    context = ""
    if req.video_title:
        context += f"원본 영상 제목: {req.video_title}\n"
    if req.raw_content:
        context += f"영상 자막 일부:\n\"\"\"\n{req.raw_content[:800]}\n\"\"\"\n"
    if req.analysis:
        a = req.analysis
        if a.get("niche"):        context += f"채널 틈새시장: {a['niche']}\n"
        if a.get("target"):       context += f"핵심 타겟: {a['target']}\n"
        if a.get("title_pattern"):context += f"검증된 제목 공식: {a['title_pattern']}\n"
        if a.get("hook"):         context += f"오프닝 훅 패턴: {a['hook']}\n"

    prompt = (
        f"{context}\n"
        f"위 영상 내용과 채널 분석을 바탕으로, 이 영상에서 파생할 수 있는 독창적인 "
        f"후속 영상 아이디어 {req.count}가지를 만들어줘.\n"
        "조건:\n"
        "1) 반드시 위 자막 내용과 직접 연관된 주제일 것 (범용 아이디어 금지).\n"
        "2) 실제 업로드할 영상 제목 형태로 출력.\n"
        "3) 클릭을 유도하는 훅(숫자·의문·충격·공감) 포함.\n"
        "4) 제목 길이는 15자 이상 35자 이하.\n"
        "5) 부제목·설명 추가 금지. 제목 하나만 출력.\n"
        "다른 설명 없이 JSON 배열만 출력해:\n"
        '["아이디어1","아이디어2",...]'
    )
    try:
        text = await asyncio.to_thread(_sync_query, req.notebook_id, prompt)
        data = _parse_json_from_text(text)
        if isinstance(data, list):
            return {"success": True, "ideas": [str(i) for i in data[:req.count]]}
        # 폴백: 줄바꿈 파싱
        ideas = [l.strip().lstrip('-•·0123456789.)').strip() for l in text.split('\n') if l.strip()]
        return {"success": True, "ideas": [i for i in ideas if i][:req.count]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/inject-prompt")
async def inject_prompt(req: InjectPromptRequest):
    """대본 프롬프트 사전 확인 (실제 주입은 generate-script에서 수행)"""
    # 프롬프트 길이 검증만 수행
    if not req.prompt or len(req.prompt) < 10:
        raise HTTPException(status_code=400, detail="프롬프트가 너무 짧습니다.")
    return {"success": True, "prompt_length": len(req.prompt)}


@router.post("/generate-script")
async def generate_script(req: GenerateScriptRequest):
    """선택된 아이디어 + 경제학 프롬프트 구조로 대본 생성"""
    try:
        text = await asyncio.to_thread(_sync_query, req.notebook_id, req.prompt)
        if not text:
            raise HTTPException(status_code=500, detail="NLM이 빈 응답을 반환했습니다.")
        return {"success": True, "script": text, "idea": req.idea, "length": len(text)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
