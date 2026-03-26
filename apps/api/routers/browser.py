from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import subprocess
import json
import re
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# visual_detector import (apps/remotion/pipeline)
_PIPELINE_DIR = Path(__file__).resolve().parents[3] / "apps" / "remotion" / "pipeline"
if str(_PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(_PIPELINE_DIR))
try:
    from visual_detector import detect as _detect_accent
except ImportError:
    _detect_accent = lambda text: None  # noqa: E731

router = APIRouter(prefix="/api/v1/browser", tags=["Browser"])

BROWSER_SCRIPT = Path(__file__).resolve().parents[2] / "browser" / "run.py"
PYTHON = Path(__file__).resolve().parents[1] / ".venv" / "Scripts" / "python.exe"
SESSION_FILE = Path(__file__).resolve().parents[2] / ".." / "tmp" / "browser_session.json"
IMAGES_DIR = SESSION_FILE.parent / "browser_images"
TTS_DIR = Path(__file__).resolve().parents[3] / "tmp" / "tts"


# ── 헬퍼 ──────────────────────────────────────────────────────────────────────

_KO_TTS_CPS = 4.5  # 한국어 edge-tts 평균 글자/초 (fallback 추정용)


def _get_tts_duration(scene_idx: int, fallback_text: str = "") -> float:
    """TTS MP3 파일 길이(초) 반환. 파일 없거나 너무 짧으면 글자 수로 추정."""
    path = TTS_DIR / f"tts_{scene_idx}.mp3"
    mp3_dur = 0.0
    if path.exists():
        try:
            result = subprocess.run(
                ["ffprobe", "-v", "quiet", "-print_format", "json",
                 "-show_streams", str(path)],
                capture_output=True, text=True, timeout=10,
            )
            data = json.loads(result.stdout)
            for stream in data.get("streams", []):
                if "duration" in stream:
                    mp3_dur = round(float(stream["duration"]), 3)
                    break
        except Exception:
            pass

    # MP3 실제 길이 우선 — 파일 없을 때만 글자 수 추정 사용
    if mp3_dur > 0:
        return mp3_dur
    if fallback_text:
        return round(len(fallback_text) / _KO_TTS_CPS, 2)
    return 0.0


def _apply_accents_timing(text: str, tts_duration: float, accents: list) -> list:
    """Gemini accent 배열에 TTS hint 기반 타이밍 적용 (비중복 보장)."""
    if not accents or tts_duration <= 0:
        return []

    # 공백 제거 텍스트 — hint 위치 검색용
    text_flat = re.sub(r'\s', '', text)
    total_len = len(text_flat) or 1

    result = []
    last_end = 0.0

    for accent in accents:
        hint = re.sub(r'\s', '', str(accent.get("hint") or ""))

        # hint로 char 위치 → 시간 비율 계산
        pos_ratio = None
        if hint:
            idx = text_flat.find(hint[:20])   # 앞 20자만 검색
            if idx >= 0:
                pos_ratio = idx / total_len

        if pos_ratio is None:
            # hint 실패 → value 숫자로 재시도
            value_search = re.sub(r'[^\uAC00-\uD7A3\d]', '', str(accent.get("value") or ""))
            if value_search:
                idx = text_flat.find(value_search)
                if idx >= 0:
                    pos_ratio = idx / total_len

        seg_start = (pos_ratio or 0) * tts_duration
        seg_start = max(seg_start, last_end)           # 앞 accent와 겹치지 않도록
        seg_end   = min(seg_start + 12.0, tts_duration)  # 최대 12초

        if seg_start >= tts_duration - 1 or seg_start >= seg_end:
            continue

        out = {k: v for k, v in accent.items() if k != "hint"}
        if "type" in out:
            out["accentType"] = out.pop("type")
        out["start_sec"] = round(seg_start, 2)
        out["end_sec"]   = round(seg_end,   2)
        result.append(out)
        last_end = seg_end

    return result


def _detect_timed_accents(text: str, tts_duration: float) -> list:
    """폴백: regex 기반 accent 감지 (Gemini accent 없을 때만 사용)."""
    sentences = [s.strip() for s in re.split(r'\s*[.!?。]\s+', text) if s.strip()]
    if not sentences:
        sentences = [text]

    total_chars = sum(len(s) for s in sentences)
    if total_chars == 0 or tts_duration <= 0:
        return []

    result = []
    pos = 0
    last_end = 0.0

    for s in sentences:
        seg_start = (pos / total_chars) * tts_duration
        seg_end   = ((pos + len(s)) / total_chars) * tts_duration

        raw = _detect_accent(s)
        if raw and "type" in raw:
            show_start = max(seg_start, last_end)
            show_end   = max(seg_end, show_start + 5.0)
            show_end   = min(show_end, tts_duration)

            if show_start < show_end:
                accent = {**raw, "accentType": raw["type"]}
                del accent["type"]
                accent["start_sec"] = round(show_start, 2)
                accent["end_sec"]   = round(show_end,   2)
                result.append(accent)
                last_end = show_end

        pos += len(s)

    return result


# ── 라우터 ────────────────────────────────────────────────────────────────────

class OpenRequest(BaseModel):
    tool_url: str
    tool_id: str = ""
    scene: int = 0
    scenes: List[str] = []
    prompts: List[str] = []
    accents: List = []   # 씬별 accent 배열의 배열 (List[List[dict]])


@router.post("/open")
async def open_link_browser(req: OpenRequest):
    """링크브라우저(2분할 뷰) 실행 + 씬 데이터 저장"""
    if not BROWSER_SCRIPT.exists():
        raise HTTPException(status_code=500, detail="browser/run.py 없음")

    SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    SESSION_FILE.write_text(json.dumps({
        "scenes": req.scenes,
        "prompts": req.prompts,
        "accents": req.accents,
        "tool_id": req.tool_id,
        "scene": req.scene,
    }, ensure_ascii=False), encoding="utf-8")

    cmd = [
        str(PYTHON), "-X", "utf8", str(BROWSER_SCRIPT),
        "--tool-url", req.tool_url,
        "--tool-id", req.tool_id,
        "--scene", str(req.scene),
    ]
    subprocess.Popen(cmd, creationflags=0x00000008)  # DETACHED_PROCESS
    return {"success": True}


@router.get("/session")
async def get_browser_session():
    """링크브라우저 씬 데이터 조회"""
    if not SESSION_FILE.exists():
        return {"scenes": [], "prompts": []}
    return json.loads(SESSION_FILE.read_text(encoding="utf-8"))


@router.post("/upload-image")
async def upload_scene_image(scene_idx: int = Form(...), file: UploadFile = File(...)):
    """링크브라우저에서 씬 이미지 업로드"""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    img_path = IMAGES_DIR / f"scene_{scene_idx}.png"
    img_path.write_bytes(await file.read())
    return {"success": True, "scene_idx": scene_idx}


@router.post("/submit-images")
async def submit_all_images():
    """링크브라우저 → 키프레임 페이지로 이미지 전달 완료 신호"""
    if not IMAGES_DIR.exists():
        return {"success": False, "count": 0}
    images = sorted(IMAGES_DIR.glob("scene_*.png"))
    return {"success": True, "count": len(images)}


def _gemini_call(client, prompt: str) -> list | dict | None:
    """Gemini 호출 → JSON 파싱. 실패 시 None."""
    try:
        resp = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        raw = resp.text.strip()
        raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
        raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE).strip()
        return json.loads(raw)
    except Exception:
        return None


def _gemini_detect_accents(scenes_text: list[str]) -> list[list]:
    """Gemini Flash로 씬별 accent 배열 감지 — 2차 호출 분리 방식.
    1차: num 통계 (최대 3개)
    2차: bar/flow/list 중 가장 적합한 1개 (num 반환 불가)
    """
    api_key = os.environ.get("GOOGLE_API_KEY", "")
    if not api_key:
        return [[] for _ in scenes_text]

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
    except Exception:
        return [[] for _ in scenes_text]

    results: list[list] = []
    for text in scenes_text:
        clean = re.sub(r'\[씬\s*\d+\]', '', text).strip()[:2000]
        if not clean:
            results.append([])
            continue

        # ── 1차 호출: num 통계 ──────────────────────────────────────────────────
        prompt_num = f"""Korean video scene. Extract up to 3 impressive statistics worth visualizing as big numbers.
Output ONLY a JSON array ([] if none found).

Rules:
- ONLY extract standalone numeric stats (counts, amounts, percentages, durations)
- IGNORE years (2024년, 2023년 etc)
- Each item MUST include "hint": exact short phrase (5-15 chars) from the text near that number

Format: [{{"type":"num", "value":"49만개", "label":"사업장 폐업", "hint":"49만 개의 사업장"}}]

Scene:
{clean}

JSON array:"""

        # ── 2차 호출: bar / flow / list ─────────────────────────────────────────
        prompt_visual = f"""Korean video scene. Find the single best visual structure — CHOOSE ONE of: bar, flow, or list.
Output ONLY a JSON object, or null if none applies.

- bar:  two things being CONTRASTED or COMPARED (A방식 vs B방식, A는 X지만 B는 Y). Values can be qualitative.
- flow: a SEQUENCE of steps described in order (먼저→그다음→마지막)
- list: 3 or more PARALLEL items enumerated (장점, 순위, 항목 나열)

DO NOT output "num" type. If no bar/flow/list structure exists, output null.
Each item MUST include "hint": exact short phrase (5-15 chars) from the text.

Formats:
- bar:  {{"type":"bar",  "left":{{"label":"A","value":"설명A"}}, "right":{{"label":"B","value":"설명B"}}, "hint":"..."}}
- flow: {{"type":"flow", "steps":["1단계","2단계","3단계"], "hint":"..."}}
- list: {{"type":"list", "items":["항목1","항목2","항목3"], "hint":"..."}}

Scene:
{clean}

JSON object or null:"""

        scene_accents: list = []

        parsed_num = _gemini_call(client, prompt_num)
        if isinstance(parsed_num, list):
            scene_accents.extend(parsed_num)

        parsed_visual = _gemini_call(client, prompt_visual)
        if isinstance(parsed_visual, dict) and parsed_visual.get("type") in ("bar", "flow", "list"):
            scene_accents.append(parsed_visual)

        results.append(scene_accents)

    return results


@router.get("/scenes-with-accents")
async def get_scenes_with_accents():
    """browser_session의 씬 텍스트 + TTS 타이밍 기반 accent 감지"""
    if not SESSION_FILE.exists():
        return {"scenes": [], "videoTitle": ""}
    data = json.loads(SESSION_FILE.read_text(encoding="utf-8"))
    scenes_text: list[str] = data.get("scenes", [])

    # videoTitle: 첫 씬 텍스트 앞 35자
    first_clean = re.sub(r'\[씬\s*\d+\]', '', scenes_text[0]).strip() if scenes_text else ""
    m = re.search(r'[.!?？]', first_clean)
    video_title = first_clean[:m.start()] if m and m.start() <= 40 else first_clean[:35]

    # Gemini가 사전 감지한 accent 목록 (keyframe → browser/open 경로로 저장됨)
    # "accents" 키 존재 여부로 판단:
    #   - 키 있음 = keyframe 페이지에서 이미 Gemini 호출 완료 → 재호출 금지
    #   - 키 없음 = keyframe 미사용 경로 (개발 직접 접근) → 1회만 호출 후 캐시
    accents_already_computed = "accents" in data
    gemini_accents: list = data.get("accents", [])

    if not accents_already_computed:
        import asyncio
        gemini_accents = await asyncio.to_thread(_gemini_detect_accents, scenes_text)
        data["accents"] = gemini_accents
        SESSION_FILE.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

    result = []
    for i, text in enumerate(scenes_text):
        clean = re.sub(r'\[씬\s*\d+\]', '', text).strip()

        # 씬1(index 0): mp4 교체 예정 — accent/tts 제외
        if i == 0:
            result.append({
                "index": i, "text": clean,
                "accents": [], "tts_duration": 0.0,
                "has_image": (IMAGES_DIR / f"scene_{i}.png").exists(),
            })
            continue

        tts_duration = _get_tts_duration(i, fallback_text=clean)

        # Gemini accent 배열 우선 사용 → 없으면 regex 폴백
        scene_accents = gemini_accents[i] if i < len(gemini_accents) else None
        if isinstance(scene_accents, list) and scene_accents:
            accents = _apply_accents_timing(clean, tts_duration, scene_accents)
        elif isinstance(scene_accents, dict):
            # 구버전 단일 dict 호환
            accents = _apply_accents_timing(clean, tts_duration, [scene_accents])
        else:
            accents = _detect_timed_accents(clean, tts_duration)

        result.append({
            "index": i,
            "text": clean,
            "accents": accents,
            "tts_duration": tts_duration,
            "has_image": (IMAGES_DIR / f"scene_{i}.png").exists(),
        })

    return {"scenes": result, "videoTitle": video_title}


@router.get("/images/{scene_idx}")
async def get_scene_image(scene_idx: int):
    """씬 이미지 조회"""
    img_path = IMAGES_DIR / f"scene_{scene_idx}.png"
    if not img_path.exists():
        raise HTTPException(404, "이미지 없음")
    return FileResponse(str(img_path), media_type="image/png")


@router.get("/audio/{scene_idx}")
async def get_scene_audio(scene_idx: int):
    """씬 TTS 오디오 조회"""
    audio_path = TTS_DIR / f"tts_{scene_idx}.mp3"
    if not audio_path.exists():
        raise HTTPException(404, "오디오 없음")
    return FileResponse(str(audio_path), media_type="audio/mpeg")
