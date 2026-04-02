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
from ._accent_types import ACCENT_TYPES_PROMPT, SCENE_ROLE_PROMPT, VALID_ACCENT_TYPES

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
        except Exception as e:
            import logging
            logging.warning("[browser] ffprobe 실패 scene_%s: %s", scene_idx, e)

    # MP3 실제 길이 우선 — 파일 없을 때만 글자 수 추정 사용
    if mp3_dur > 0:
        return mp3_dur
    if fallback_text:
        return round(len(fallback_text) / _KO_TTS_CPS, 2)
    return 0.0


def _load_word_timestamps(scene_idx: int) -> list:
    """TTS 생성 시 저장된 단어 타이밍 JSON 로드. 없으면 빈 리스트."""
    words_path = TTS_DIR / f"tts_{scene_idx}_words.json"
    if not words_path.exists():
        return []
    try:
        return json.loads(words_path.read_text(encoding="utf-8"))
    except Exception:
        return []


def _build_subtitle_chunks(scaled_wt: list, max_chars: int = 22) -> list:
    """단어 타이밍 목록을 최대 max_chars 단위 자막 청크로 분리.
    각 청크: {text, start, end}"""
    chunks = []
    batch: list = []
    char_len = 0
    for w in scaled_wt:
        word_len = len(w["word"].replace(" ", ""))
        if char_len + word_len > max_chars and batch:
            chunks.append({
                "text": "".join(x["word"] for x in batch).replace(".", "").strip(),
                "start": batch[0]["start"],
                "end": batch[-1]["end"],
            })
            batch = []
            char_len = 0
        batch.append(w)
        char_len += word_len
    if batch:
        chunks.append({
            "text": "".join(x["word"] for x in batch).replace(".", "").strip(),
            "start": batch[0]["start"],
            "end": batch[-1]["end"],
        })
    return chunks


def _find_hint_in_words(hint: str, words: list, scale: float = 1.0) -> float | None:
    """단어 타이밍 목록에서 hint 텍스트가 시작되는 시간(초) 반환.
    연속 단어를 합쳐서 슬라이딩 윈도우로 검색 — 다중 단어 hint 처리.
    scale: edge-tts → 실제 TTS(Supertone 등) 시간 환산 비율."""
    hint_clean = re.sub(r'\s', '', hint)[:25]
    if not hint_clean or not words:
        return None
    for i in range(len(words)):
        combined = ""
        for j in range(i, min(i + 10, len(words))):
            combined += re.sub(r'\s', '', words[j]["word"])
            if hint_clean in combined:
                return round(words[i]["start"] * scale, 3)
            if len(combined) >= len(hint_clean) + 4:
                break
    return None


# 타입별 기본 표시 시간(초) — 씬 길이와 무관한 절대 기준
_ACCENT_WINDOW: dict[str, float] = {
    "num":              5.0,
    "bar":              6.0,
    "flow":             8.0,
    "list":             7.0,
    "split_screen":     9.0,
    "stat_card":        8.0,
    "comparison_table": 12.0,
    "timeline":         11.0,
    "ranking_list":     10.0,
    "icon_grid":        9.0,
    "flowchart":        10.0,
    "quote_hero":       7.0,
}
_ACCENT_WINDOW_DEFAULT = 8.0
_ACCENT_MAX_RATIO = 0.6  # 씬 길이의 최대 60%까지만 accent 점유


def _apply_accents_timing(text: str, tts_duration: float, accents: list,
                          word_timestamps: list | None = None) -> list:
    """Gemini accent 배열에 TTS 타이밍 적용 (비중복 보장).

    우선순위:
      1) word_timestamps (edge-tts WordBoundary) — ±0.3s 정확도
      2) char 위치 비율 폴백                    — ±5~8s 오차
    """
    if not accents or tts_duration <= 0:
        return []

    # 폴백용 공백 제거 텍스트
    text_flat = re.sub(r'\s', '', text)
    total_len = len(text_flat) or 1

    result = []
    last_end = 0.0

    for accent in accents:
        hint = str(accent.get("hint") or "")

        # ── 1순위: 단어 타이밍 JSON ─────────────────────────────────────────
        seg_start = None
        if word_timestamps:
            # edge-tts 기준 타이밍 → 실제 TTS 길이로 스케일 조정
            # (edge-tts와 Supertone의 발화 속도 차이 보정)
            edge_duration = word_timestamps[-1]["end"] if word_timestamps else tts_duration
            scale = tts_duration / edge_duration if edge_duration > 0 else 1.0
            seg_start = _find_hint_in_words(hint, word_timestamps, scale)

        # ── 2순위: char 위치 비율 폴백 ──────────────────────────────────────
        if seg_start is None:
            hint_flat = re.sub(r'\s', '', hint)
            pos_ratio = None
            if hint_flat:
                idx = text_flat.find(hint_flat[:20])
                if idx >= 0:
                    pos_ratio = idx / total_len
            if pos_ratio is None:
                value_search = re.sub(r'[^\uAC00-\uD7A3\d]', '', str(accent.get("value") or ""))
                if value_search:
                    idx = text_flat.find(value_search)
                    if idx >= 0:
                        pos_ratio = idx / total_len
            seg_start = (pos_ratio or 0) * tts_duration

        seg_start = max(seg_start, last_end)

        # 타입별 적정 window + 씬 길이 60% 상한
        accent_type = accent.get("type") or accent.get("accentType") or ""
        base_window = _ACCENT_WINDOW.get(accent_type, _ACCENT_WINDOW_DEFAULT)
        window = min(base_window, tts_duration * _ACCENT_MAX_RATIO)
        seg_end = min(seg_start + window, tts_duration)

        if seg_start >= tts_duration - 0.5 or seg_start >= seg_end:
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


class SessionSaveRequest(BaseModel):
    tool_id: str = ""
    scene: int = 0
    scenes: List[str] = []
    prompts: List[str] = []
    accents: List = []
    script_id: str = ""
    mp4_prompts: List[str] = []


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


@router.post("/session-save")
async def save_browser_session(req: SessionSaveRequest):
    """씬 데이터만 저장 (pywebview 실행 없음 — 익스텐션/새 탭 방식용)"""
    SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    SESSION_FILE.write_text(json.dumps({
        "scenes": req.scenes,
        "prompts": req.prompts,
        "accents": req.accents,
        "tool_id": req.tool_id,
        "scene": req.scene,
        "script_id": req.script_id,
        "mp4_prompts": req.mp4_prompts,
    }, ensure_ascii=False), encoding="utf-8")
    return {"success": True}


@router.patch("/scene-accent-edit")
async def patch_scene_accent_edit(payload: dict):
    """사용자가 수동 삭제/타이밍 조정한 timed accents를 씬별로 저장.
    timed_accents_override 키에 저장하여 scenes-with-accents GET 시 우선 사용."""
    scene_idx: int = payload.get("scene_idx", -1)
    timed_accents: list = payload.get("timed_accents", [])
    if not SESSION_FILE.exists():
        return {"success": False, "reason": "session not found"}
    data = json.loads(SESSION_FILE.read_text(encoding="utf-8"))
    overrides: list = data.get("timed_accents_override", [])
    # 길이 맞춤
    scenes_len = len(data.get("scenes", []))
    while len(overrides) < scenes_len:
        overrides.append(None)
    if 0 <= scene_idx < len(overrides):
        overrides[scene_idx] = timed_accents
    data["timed_accents_override"] = overrides
    SESSION_FILE.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return {"success": True}


@router.post("/scene-accent-redetect/{scene_idx}")
async def redetect_scene_accent(scene_idx: int):
    """단일 씬 Gemini accent 재감지. 해당 씬의 timed_accents_override를 초기화."""
    if not SESSION_FILE.exists():
        return {"success": False, "reason": "session not found"}
    data = json.loads(SESSION_FILE.read_text(encoding="utf-8"))
    scenes_text: list[str] = data.get("scenes", [])
    if scene_idx < 0 or scene_idx >= len(scenes_text):
        return {"success": False, "reason": "scene_idx out of range"}

    text = scenes_text[scene_idx]
    clean = re.sub(r'\[씬\s*\d+\]', '', text).strip()

    # Gemini 재감지
    raw_accents = await _gemini_detect_one_scene(text)

    # 타이밍 적용
    tts_duration = _get_tts_duration(scene_idx, fallback_text=clean)
    word_timestamps = _load_word_timestamps(scene_idx)
    if raw_accents:
        timed = _apply_accents_timing(clean, tts_duration, raw_accents, word_timestamps)
    else:
        timed = _detect_timed_accents(clean, tts_duration)

    # raw 저장 + override 초기화
    gemini_accents: list = data.get("accents", [])
    while len(gemini_accents) < len(scenes_text):
        gemini_accents.append([])
    gemini_accents[scene_idx] = raw_accents
    data["accents"] = gemini_accents

    overrides: list = data.get("timed_accents_override", [])
    while len(overrides) < len(scenes_text):
        overrides.append(None)
    overrides[scene_idx] = None
    data["timed_accents_override"] = overrides

    SESSION_FILE.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return {"success": True, "accents": timed}


@router.patch("/session-accents")
async def patch_session_accents(payload: dict):
    """translate 완료 직후 accents만 SESSION_FILE에 덮어씀 (나머지 필드 유지).
    scenes_hash도 현재 SESSION_FILE의 scenes 기준으로 재계산 — 이중 Gemini 호출 방지."""
    import hashlib
    accents = payload.get("accents", [])
    if not SESSION_FILE.exists():
        return {"success": False, "reason": "session not found"}
    data = json.loads(SESSION_FILE.read_text(encoding="utf-8"))
    scenes_text = data.get("scenes", [])
    current_hash = hashlib.sha256(
        json.dumps(scenes_text, ensure_ascii=False, sort_keys=False).encode()
    ).hexdigest()[:16]
    data["accents"] = accents
    data["scenes_hash"] = current_hash
    SESSION_FILE.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
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


@router.delete("/image/{scene_idx}")
async def delete_scene_image(scene_idx: int):
    """단일 씬 이미지 삭제"""
    img_path = IMAGES_DIR / f"scene_{scene_idx}.png"
    if img_path.exists():
        img_path.unlink(missing_ok=True)
    return {"success": True, "scene_idx": scene_idx}


@router.delete("/clear-images")
async def clear_browser_images():
    """새 대본 시작 시 서버 이미지 전체 초기화"""
    if not IMAGES_DIR.exists():
        return {"success": True, "cleared": 0}
    images = list(IMAGES_DIR.glob("scene_*.png"))
    for f in images:
        f.unlink(missing_ok=True)
    return {"success": True, "cleared": len(images)}


def _gemini_call(client, prompt: str) -> list | dict | None:
    """Gemini 호출 → JSON 파싱. 실패 시 None."""
    import logging
    try:
        resp = client.models.generate_content(model="gemini-3-flash-preview", contents=prompt)
        raw = resp.text.strip()
        logging.info("[_gemini_call] 응답 raw (앞 300자): %s", raw[:300])
        raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
        raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE).strip()
        return json.loads(raw)
    except json.JSONDecodeError as e:
        logging.warning("[_gemini_call] JSON 파싱 실패: %s | raw=%s", e, raw[:200] if 'raw' in dir() else '')
        return None
    except Exception as e:
        logging.warning("[_gemini_call] Gemini 호출 실패: %s | type=%s", e, type(e).__name__)
        return None


async def _gemini_detect_one_scene(text: str) -> list:
    """단일 씬 Gemini accent 감지 — 씬별 재감지에 사용."""
    import logging
    import asyncio as _asyncio
    api_key = os.environ.get("GOOGLE_API_KEY", "")
    if not api_key:
        return []
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
    except Exception as e:
        logging.warning("[_gemini_detect_one_scene] google-genai 임포트 실패: %s", e)
        return []

    clean = re.sub(r'\[씬\s*\d+\]', '', text).strip()[:2000]
    if not clean:
        return []

    prompt = f"""You are a Korean video scene analyst. Analyze the scene below using TWO steps.

{SCENE_ROLE_PROMPT}

CRITICAL RULES:
1. A number appearing in the scene does NOT automatically mean "evidence" role or "num" type.
   If the scene's core message is a concept, contrast, or emotion — classify accordingly.
2. "key_point" is PREFERRED over "num" when the sentence itself carries the impact.
3. comparison_table and flowchart require multi-criteria data — do NOT use for a single short scene.
4. IGNORE years (2020년, 2024년 etc.) when considering "num" type.
5. Return 0-2 accents only. Fewer but accurate is far better than many but wrong.
6. Each accent must have "hint": an exact short phrase (5-15 chars) from the scene text.

TYPE REFERENCE:
{ACCENT_TYPES_PROMPT}

Scene (Korean):
{clean}

Output JSON (exactly this shape, no other text):
{{"role": "<role>", "accents": []}}"""

    parsed = await _asyncio.to_thread(_gemini_call, client, prompt)

    if isinstance(parsed, dict) and "accents" in parsed:
        accents = parsed.get("accents", [])
        if isinstance(accents, list):
            return [a for a in accents if isinstance(a, dict) and a.get("type") in VALID_ACCENT_TYPES]
        return []
    if isinstance(parsed, list):
        return [a for a in parsed if isinstance(a, dict) and a.get("type") in VALID_ACCENT_TYPES]
    if isinstance(parsed, dict) and parsed.get("type") in VALID_ACCENT_TYPES:
        return [parsed]
    return []


async def _gemini_detect_accents(scenes_text: list[str]) -> list[list]:
    """Gemini Flash로 씬별 accent 배열 감지 — 폴백 전용 (translate.py 미실행 시).
    씬당 1호출, 전체 씬 병렬 실행.
    """
    import asyncio as _asyncio
    return list(await _asyncio.gather(*[_gemini_detect_one_scene(t) for t in scenes_text]))


@router.get("/scenes-with-accents")
async def get_scenes_with_accents():
    """browser_session의 씬 텍스트 + TTS 타이밍 기반 accent 감지"""
    if not SESSION_FILE.exists():
        return {"scenes": [], "videoTitle": ""}
    data = json.loads(SESSION_FILE.read_text(encoding="utf-8"))
    scenes_text: list[str] = data.get("scenes", [])

    # videoTitle: 첫 씬 텍스트 앞 40자 (9:16 기준 자연스러운 2줄)
    first_clean = re.sub(r'\[씬\s*\d+\]', '', scenes_text[0]).strip() if scenes_text else ""
    video_title = first_clean[:35]

    # 대본 hash로 캐시 유효성 검증 — 대본이 바뀌면 accent 재호출
    import hashlib
    current_hash = hashlib.sha256(
        json.dumps(scenes_text, ensure_ascii=False, sort_keys=False).encode()
    ).hexdigest()[:16]

    cached_hash = data.get("scenes_hash", "")
    gemini_accents: list = data.get("accents", [])
    # 모든 씬 accent가 빈 배열이면 Gemini 실패로 간주 → 재호출
    all_empty = bool(gemini_accents) and all(
        isinstance(a, list) and len(a) == 0 for a in gemini_accents
    )
    needs_recompute = (cached_hash != current_hash) or ("accents" not in data) or all_empty

    if needs_recompute:
        gemini_accents = await _gemini_detect_accents(scenes_text)
        data["accents"] = gemini_accents
        data["scenes_hash"] = current_hash
        SESSION_FILE.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

    timed_overrides: list = data.get("timed_accents_override", [])

    result = []
    for i, text in enumerate(scenes_text):
        clean = re.sub(r'\[씬\s*\d+\]', '', text).strip()

        has_mp4 = i == 0 and (IMAGES_DIR / "scene_0.mp4").exists()

        if has_mp4:
            # 씬1에 mp4가 있으면 Remotion/edge-tts 미적용
            accents = []
            tts_duration = 0.0
            scaled_wt: list = []
        else:
            tts_duration = _get_tts_duration(i, fallback_text=clean)
            word_timestamps = _load_word_timestamps(i)

            # 사용자 수동 편집 override 우선 사용
            override = timed_overrides[i] if i < len(timed_overrides) else None
            if isinstance(override, list):
                accents = override
            else:
                # Gemini accent 배열 우선 사용 → 없으면 regex 폴백
                scene_accents = gemini_accents[i] if i < len(gemini_accents) else None
                if isinstance(scene_accents, list) and scene_accents:
                    accents = _apply_accents_timing(clean, tts_duration, scene_accents, word_timestamps)
                elif isinstance(scene_accents, dict):
                    # 구버전 단일 dict 호환
                    accents = _apply_accents_timing(clean, tts_duration, [scene_accents], word_timestamps)
                else:
                    accents = _detect_timed_accents(clean, tts_duration)

            # 단어 타이밍을 실제 TTS 길이에 맞게 스케일 조정
            _end_cap = max(tts_duration - 0.25, tts_duration * 0.92)  # 후미 침묵 제거
            if word_timestamps and tts_duration > 0:
                edge_dur = word_timestamps[-1]["end"]
                wt_scale = tts_duration / edge_dur if edge_dur > 0 else 1.0
                scaled_wt = [
                    {
                        "word": w["word"],
                        "start": round(w["start"] * wt_scale, 3),
                        "end": round(min(w["end"] * wt_scale, _end_cap), 3),
                    }
                    for w in word_timestamps
                ]
            elif tts_duration > 0:
                # WordBoundary 없음 → 글자 비율 기반 추정 타이밍 (공백 suffix 포함)
                words = clean.split()
                total_chars = sum(len(w) for w in words) or 1
                pos = 0
                scaled_wt = []
                for idx_w, w in enumerate(words):
                    start = round((pos / total_chars) * tts_duration, 3)
                    pos += len(w)
                    end = round(min((pos / total_chars) * tts_duration, _end_cap), 3)
                    # 마지막 단어 제외 공백 suffix
                    word_text = w + (' ' if idx_w < len(words) - 1 else '')
                    scaled_wt.append({"word": word_text, "start": start, "end": end})
            else:
                scaled_wt = []

        subtitle_chunks = _build_subtitle_chunks(scaled_wt) if scaled_wt else []

        result.append({
            "index": i,
            "text": clean,
            "accents": accents,
            "tts_duration": tts_duration,
            "has_image": (IMAGES_DIR / f"scene_{i}.png").exists(),
            "has_mp4": has_mp4,
            "subtitle_chunks": subtitle_chunks,
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


@router.get("/video/{scene_idx}")
async def get_scene_video(scene_idx: int):
    """씬 MP4 영상 조회 (씬1 전용)"""
    video_path = IMAGES_DIR / f"scene_{scene_idx}.mp4"
    if not video_path.exists():
        raise HTTPException(404, "영상 없음")
    return FileResponse(str(video_path), media_type="video/mp4")


@router.post("/video/{scene_idx}")
async def upload_scene_video(scene_idx: int, file: UploadFile = File(...)):
    """씬 MP4 업로드 (씬1 전용 — Kling/Runway 등)"""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    video_path = IMAGES_DIR / f"scene_{scene_idx}.mp4"
    video_path.write_bytes(await file.read())
    return {"success": True, "path": str(video_path)}
