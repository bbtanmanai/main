#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LinkDrop Desktop — Pipeline FastAPI Server
==========================================
Electron 앱이 자식 프로세스로 실행.
포트: 7788 (localhost only)
"""
from __future__ import annotations

import asyncio
import json
import os
import re as _re
import subprocess
import sys
import time
import threading
from pathlib import Path
from typing import Any

# ── 경로 설정 ─────────────────────────────────────────────────────────────────
ROOT_DIR     = Path(__file__).parent.parent.parent.parent  # C:\LinkDropV2
PROVIDER_DIR = ROOT_DIR / "packages/tools/skill-2-video-longform1/opal-manager"
sys.path.insert(0, str(PROVIDER_DIR))

# .env 로드
_ENV = ROOT_DIR / ".env"
if _ENV.exists():
    for line in _ENV.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

from fastapi import FastAPI, BackgroundTasks, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn

app = FastAPI(title="LinkDrop Pipeline Server")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── 전역 상태 ─────────────────────────────────────────────────────────────────
_state: dict[str, Any] = {
    "job_id": None,
    "scenes": [],          # list of SceneStatus
    "is_running": False,
    "style_id": "hollywood-sf",
    "voice_id": "injoon",
    "speed": 1.2,
    "work_dir": None,
    "final_path": None,    # 완성 final.mp4 경로
    "tone_id": None,       # 톤앤매너 ID
    "emotion_id": None,    # 감정 ID
    "art_prompt": "",      # 화풍 프롬프트
    "text_style": "box",   # 자막 스타일: box | outline
    "app_id": "",          # NotebookLM 템플릿 ID
    "topic": "",           # 영상 주제
    "visual_types": [],    # 씬별 비주얼타입 JSON (Remotion용)
    "bg_groups": {},       # 배경 그룹 (3~6개) + 씬 매핑
    "overlay": {
        "enabled":         True,
        "title_bar_h":     90,
        "sub_bar_h":       90,
        "title_font_size": 36,
        "sub_font_size":   28,
        "title_font":      "malgunbd",
        "sub_font":        "malgun",
        "title_color":     "#ffffff",
        "sub_color":       "#ffffd2",
    },
}
_lock = threading.Lock()


def make_scene_status(index: int, text: str) -> dict:
    return {
        "index":     index,
        "text":      text,
        "img_state": "wait",   # wait|progress|done|fail
        "dub_state": "wait",
        "thumb_b64": None,     # base64 PNG (썸네일)
        "clip_path": None,     # 완성 클립 경로
        "error":     None,
    }


# ── 헬스체크 ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "time": time.time()}


# ── 스타일 목록 ───────────────────────────────────────────────────────────────
@app.get("/api/styles")
def get_styles():
    return {
        "styles": [
            {"id": "hollywood-sf",    "label": "🚀 할리우드 SF"},
            {"id": "anime-sf",        "label": "⚡ 애니메이션 SF"},
            {"id": "ink-wash",        "label": "🖌️ 수묵화풍"},
            {"id": "pixar-3d",        "label": "✨ 픽사 3D"},
            {"id": "neo-noir",        "label": "🌧️ 네오 누아르"},
            {"id": "pop-art",         "label": "🎨 팝아트"},
            {"id": "reality",         "label": "📷 실사 다큐풍"},
            {"id": "ghibli-real",     "label": "🌿 지브리 실사풍"},
            {"id": "sticker-cutout",  "label": "✂️ 스티커 컷아웃"},
        ],
        "voices": [
            {"id": "injoon",  "label": "🎙️ 인준 (남성)"},
            {"id": "sunhi",   "label": "🎙️ 선희 (여성)"},
            {"id": "hyunsu",  "label": "🎙️ 현수 (남성·젊은)"},
        ],
    }


# ── 상태 조회 ─────────────────────────────────────────────────────────────────
@app.get("/api/status")
def get_status():
    with _lock:
        done = sum(1 for s in _state["scenes"]
                   if s["img_state"] == "done" and s["dub_state"] == "done")
        return {
            "job_id":     _state["job_id"],
            "is_running": _state["is_running"],
            "style_id":   _state["style_id"],
            "voice_id":   _state["voice_id"],
            "total":      len(_state["scenes"]),
            "done":       done,
            "scenes":     _state["scenes"],
            "final_path": _state.get("final_path"),
            "final_path_16x9": _state.get("final_path_16x9"),
            "final_path_9x16": _state.get("final_path_9x16"),
            "art_prompt": _state.get("art_prompt", "")[:80],
            "topic":      _state.get("topic", ""),
        }


# ── 시나리오 설정 ─────────────────────────────────────────────────────────────
@app.post("/api/setup")
async def setup(request: Request):
    body = await request.json()
    """씬 텍스트 목록과 설정을 받아 상태 초기화."""
    scenes_text = body.get("scenes", [])
    style_id    = body.get("style_id", "hollywood-sf")
    voice_id    = body.get("voice_id", "injoon")
    speed       = float(body.get("speed", 1.2))
    overlay     = body.get("overlay", {})

    with _lock:
        if _state["is_running"]:
            return {"ok": False, "error": "생성 중 설정 변경 불가"}
        _state["scenes"]   = [make_scene_status(i, t) for i, t in enumerate(scenes_text)]
        _state["style_id"] = style_id
        _state["voice_id"] = voice_id
        _state["speed"]    = speed
        if overlay:
            _state["overlay"].update(overlay)
        _state["job_id"]   = f"job_{int(time.time())}"
        _state["work_dir"] = str(ROOT_DIR / "tmp" / _state["job_id"])

    return {"ok": True, "job_id": _state["job_id"], "total": len(scenes_text)}


# ── 웹앱에서 시나리오 수신 + 자동 생성 시작 ──────────────────────────────────
@app.post("/api/load-scenario")
async def load_scenario(request: Request):
    body = await request.json()
    """웹앱(longform)에서 생성된 시나리오를 받아 상태에 로드하고 생성 시작."""
    raw_script  = body.get("script", "")       # [씬N] 형식 전체 텍스트
    scenes_list = body.get("scenes", [])       # 또는 이미 파싱된 리스트
    style_id    = body.get("style_id", _state["style_id"])

    # 웹 voice_id (Google TTS) → 프로그램 voice_id (edge-tts) 매핑
    _WEB_VOICE_MAP = {
        "ko-KR-Neural2-A": "sunhi",    # 고은 → 선희 (여성)
        "ko-KR-Neural2-B": "sunhi",    # 미소 → 선희
        "ko-KR-Neural2-C": "injoon",   # 준호 → 인준 (남성)
        "ko-KR-Wavenet-A": "sunhi",    # 다인 → 선희
        "ko-KR-Wavenet-B": "sunhi",    # 서윤 → 선희
        "ko-KR-Wavenet-C": "injoon",   # 하준 → 인준
        "ko-KR-Standard-A": "injoon",  # 영철 → 인준
        "ko-KR-Standard-C": "injoon",  # 도윤 → 인준
    }
    raw_voice = body.get("voice_id", _state["voice_id"])
    voice_id  = _WEB_VOICE_MAP.get(raw_voice, raw_voice)  # 매핑 없으면 원본 사용
    speed       = float(body.get("speed", _state["speed"]))
    tone_id     = body.get("tone_id", None)
    emotion_id  = body.get("emotion_id", None)
    art_prompt  = body.get("art_prompt", "")
    text_style  = body.get("text_style", "box")   # box | outline
    app_id      = body.get("app_id", "")
    topic       = body.get("topic", "")
    auto_start  = body.get("auto_start", True)

    # [씬N] 형식 파싱 (scenes_list가 없을 때)
    if not scenes_list and raw_script:
        parts = _re.findall(r"\[씬\d+\]\s*(.+?)(?=\[씬\d+\]|$)", raw_script, _re.DOTALL)
        scenes_list = [p.strip() for p in parts if p.strip()]

    if not scenes_list:
        return {"ok": False, "error": "씬 데이터가 없습니다"}

    with _lock:
        if _state["is_running"]:
            return {"ok": False, "error": "현재 생성 중입니다. 완료 후 다시 시도해주세요."}
        _state["scenes"]     = [make_scene_status(i, t) for i, t in enumerate(scenes_list)]
        _state["style_id"]   = style_id
        _state["voice_id"]   = voice_id
        _state["speed"]      = speed
        _state["tone_id"]    = tone_id
        _state["emotion_id"] = emotion_id
        _state["art_prompt"] = art_prompt
        _state["text_style"] = text_style
        _state["app_id"]     = app_id
        _state["topic"]      = topic
        _state["final_path"] = None
        _state["job_id"]     = f"job_{int(time.time())}"
        _state["work_dir"]   = str(ROOT_DIR / "tmp" / _state["job_id"])
        _state["is_running"] = False

    print(f"[Scenario] 수신 완료: {len(scenes_list)}개 씬, style={style_id}, voice={voice_id}, topic={topic}", flush=True)

    if auto_start:
        with _lock:
            _state["is_running"] = True
        import threading as _threading
        _threading.Thread(target=_run_pipeline, daemon=True).start()

    return {"ok": True, "job_id": _state["job_id"], "total": len(scenes_list), "auto_start": auto_start}


# ── 생성 시작 ─────────────────────────────────────────────────────────────────
@app.post("/api/generate")
def start_generate(background_tasks: BackgroundTasks):
    with _lock:
        if _state["is_running"]:
            return {"ok": False, "error": "이미 실행 중"}
        if not _state["scenes"]:
            return {"ok": False, "error": "시나리오 없음"}
        _state["is_running"] = True

    background_tasks.add_task(_run_pipeline)
    return {"ok": True, "message": "생성 시작"}


def _run_pipeline():
    """백그라운드 파이프라인 실행."""
    _stop_flag.clear()
    try:
        style_id  = _state["style_id"]
        voice_id  = _state["voice_id"]
        speed     = _state["speed"]
        work_dir  = Path(_state["work_dir"])
        work_dir.mkdir(parents=True, exist_ok=True)

        scenes = _state["scenes"]

        # ── 1단계: 키프레임 생성 (NLM slide_deck) ─────────────────────────
        if is_stopped():
            print("[Pipeline] 사용자 중지 (1단계 전)", flush=True); return
        art_prompt = _state.get("art_prompt", "")
        _generate_keyframes_nlm(scenes, style_id, work_dir, art_prompt)

        # ── 2단계: 씬별 TTS 더빙 ──────────────────────────────────────────
        for scene in scenes:
            if is_stopped():
                print("[Pipeline] 사용자 중지 (TTS 중)", flush=True); return
            _generate_dub(scene, voice_id, work_dir, speed)

        # ── 3단계: FFmpeg 클립 합성 (키프레임 PNG + TTS MP3 → clip_N.mp4) ─
        if is_stopped():
            print("[Pipeline] 사용자 중지 (클립 합성 전)", flush=True); return
        clip_paths = _generate_clips(scenes, work_dir)

        # ── 4단계: Final MP4 합성 (concat + BGM) ──────────────────────────
        if is_stopped():
            print("[Pipeline] 사용자 중지 (최종 합성 전)", flush=True); return
        if clip_paths:
            final_path = _merge_final(clip_paths, work_dir)
            if final_path:
                with _lock:
                    _state["final_path"] = str(final_path)
                print(f"[Pipeline] 완성 영상: {final_path}", flush=True)

    except Exception as e:
        print(f"[Pipeline] 오류: {e}", flush=True)
    finally:
        with _lock:
            _state["is_running"] = False
        print("[Pipeline] 완료", flush=True)


FONT_DIR = ROOT_DIR / "apps" / "web" / "public" / "assets" / "font"

# 폰트 ID → 파일명 매핑 (프로그램 드롭다운과 동기화)
FONT_MAP = {
    # Paperlogy
    "paperlogy-bold":      "Paperlogy-7Bold.ttf",
    "paperlogy-extrabold": "Paperlogy-8ExtraBold.ttf",
    "paperlogy-black":     "Paperlogy-9Black.ttf",
    "paperlogy-semibold":  "Paperlogy-6SemiBold.ttf",
    "paperlogy-medium":    "Paperlogy-5Medium.ttf",
    "paperlogy-regular":   "Paperlogy-4Regular.ttf",
    # Noto Sans/Serif
    "notosans":            "NotoSansKR-VF.ttf",
    "notoserif":           "NotoSerifKR-VF.ttf",
    # 서울서체
    "seoul-namsan-b":      "SeoulNamsanB.ttf",
    "seoul-namsan-eb":     "SeoulNamsanEB.ttf",
    "seoul-hangang-b":     "SeoulHangangB.ttf",
    "seoul-hangang-eb":    "SeoulHangangEB.ttf",
    "seoul-alrim-bold":    "SeoulAlrimTTF-Bold.ttf",
    "seoul-alrim-eb":      "SeoulAlrimTTF-ExtraBold.ttf",
    # KERIS
    "keris-bold":          "KERISKEDU_B.ttf",
    "keris-regular":       "KERISKEDU_R.ttf",
    # 시스템 폴백
    "malgunbd":            None,  # Windows 시스템 폰트
    "malgun":              None,
}


def _find_korean_font(font_id: str = "paperlogy-bold") -> str | None:
    """font_id에 해당하는 폰트 파일 경로를 반환."""
    # 1순위: FONT_MAP에서 프로젝트 폰트
    filename = FONT_MAP.get(font_id)
    if filename:
        p = FONT_DIR / filename
        if p.exists():
            return str(p)

    # 2순위: font_id가 시스템 폰트 (malgunbd 등)
    system_map = {
        "malgunbd": "C:/Windows/Fonts/malgunbd.ttf",
        "malgun":   "C:/Windows/Fonts/malgun.ttf",
    }
    sp = system_map.get(font_id)
    if sp and Path(sp).exists():
        return sp

    # 3순위: 기본 폴백
    for fallback in ["Paperlogy-7Bold.ttf", "NotoSansKR-VF.ttf"]:
        p = FONT_DIR / fallback
        if p.exists():
            return str(p)

    # 최종 폴백: 시스템
    if Path("C:/Windows/Fonts/malgunbd.ttf").exists():
        return "C:/Windows/Fonts/malgunbd.ttf"
    return None


def _font_esc(font_path: str) -> str:
    """FFmpeg filter_complex용 폰트 경로 이스케이프 (Windows C:/ → C\\:/)."""
    p = font_path.replace("\\", "/")
    if len(p) > 1 and p[1] == ":":
        p = p[0] + "\\:" + p[2:]
    return p


def _escape_drawtext(text: str) -> str:
    """FFmpeg drawtext 텍스트 이스케이프."""
    text = text.replace("\\", "\\\\")
    text = text.replace("'", "\u2019")
    text = text.replace(":", "\\:")
    text = text.replace("[", "\\[").replace("]", "\\]")
    return text


def _ffprobe_duration(mp3_path: Path) -> float:
    """ffprobe로 MP3 재생 시간(초)을 반환."""
    import json as _json
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        str(mp3_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return float(_json.loads(result.stdout)["format"]["duration"])
    except Exception:
        return 5.0


def _generate_clips(scenes: list[dict], work_dir: Path) -> list[Path]:
    """
    씬별 (키프레임 PNG + TTS MP3) → clip_N.mp4 생성.

    Task 1: FFmpeg 클립 합성 버그 수정
      - format=yuv420p를 zoompan 직후 체인으로 연결
      - -pix_fmt yuv420p 추가
    Task 3: 씬별 자막 자동 연동
      - 각 씬의 scene["text"]를 drawtext 자막으로 오버레이
    """
    import subprocess as _sp

    KEYFRAME_W = 1920
    KEYFRAME_H = 1080
    fps = 25

    sub_font_id = _state.get("overlay", {}).get("sub_font", "paperlogy-bold")
    font_path = _find_korean_font(sub_font_id)
    fe = _font_esc(font_path) if font_path else None

    clip_paths: list[Path] = []

    for scene in scenes:
        idx = scene["index"]

        # 키프레임 PNG 경로 결정
        # pipeline_server가 생성한 ov_ 오버레이 파일 우선, 없으면 원본 keyframe
        ov_path  = work_dir / f"ov_keyframe_{idx:02d}.png"
        kf_path  = work_dir / f"keyframe_{idx:02d}.png"
        keyframe = ov_path if ov_path.exists() else (kf_path if kf_path.exists() else None)

        mp3_path = work_dir / f"tts_{idx:02d}.mp3"
        clip_out = work_dir / f"clip_{idx:02d}.mp4"

        if not keyframe or not mp3_path.exists():
            print(f"[클립] 씬{idx+1}: 키프레임 또는 MP3 없음 → 건너뜀", flush=True)
            continue

        if clip_out.exists():
            clip_paths.append(clip_out)
            print(f"[클립] 씬{idx+1}: 기존 클립 재사용", flush=True)
            continue

        try:
            duration = _ffprobe_duration(mp3_path)
            if duration <= 0:
                duration = 5.0
            frames = max(int(duration * fps), fps)

            # 씬 자막 텍스트 (Task 3: 고정 샘플 대신 실제 씬 텍스트 사용)
            subtitle = scene.get("text", "").strip()

            # zoompan Ken Burns 필터
            zoom_base = (
                f"scale={KEYFRAME_W}:{KEYFRAME_H}:force_original_aspect_ratio=decrease,"
                f"pad={KEYFRAME_W}:{KEYFRAME_H}:(ow-iw)/2:(oh-ih)/2,"
                f"zoompan="
                f"z='min(zoom+0.001,1.05)':"
                f"x='iw/2-(iw/zoom/2)':"
                f"y='ih/2-(ih/zoom/2)':"
                f"d={frames}:s={KEYFRAME_W}x{KEYFRAME_H}:fps={fps},"
                f"format=yuv420p"
            )

            # Task 3: 씬 자막 drawtext 추가
            if fe and subtitle:
                safe_sub = _escape_drawtext(subtitle[:40])
                zoom_filter = (
                    zoom_base +
                    f",drawtext=fontfile='{fe}':"
                    f"text='{safe_sub}':"
                    f"fontsize=52:fontcolor=white:"
                    f"shadowcolor=black:shadowx=2:shadowy=2:"
                    f"box=1:boxcolor=black@0.5:boxborderw=12:"
                    f"x=(w-tw)/2:y=h-th-40"
                )
            else:
                zoom_filter = zoom_base

            cmd = [
                "ffmpeg", "-y",
                "-loop", "1", "-i", str(keyframe),
                "-i", str(mp3_path),
                "-vf", zoom_filter,
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "128k",
                "-shortest",
                "-t", f"{duration + 0.5:.3f}",
                str(clip_out),
            ]

            r = _sp.run(cmd, capture_output=True, text=True)
            if r.returncode != 0:
                print(f"[클립] 씬{idx+1} 오류: {r.stderr[-200:]}", flush=True)
                continue

            clip_paths.append(clip_out)
            kb = clip_out.stat().st_size // 1024
            print(f"[클립] 씬{idx+1} 완료: {clip_out.name} ({kb}KB)", flush=True)

            with _lock:
                scene["clip_path"] = str(clip_out)

        except Exception as e:
            print(f"[클립] 씬{idx+1} 예외: {e}", flush=True)

    print(f"[클립] 총 {len(clip_paths)}/{len(scenes)}개 클립 생성 완료", flush=True)
    return clip_paths


def _merge_final(clip_paths: list[Path], work_dir: Path) -> Path | None:
    """
    클립 목록을 concat → final.mp4 생성.

    Task 2: 최종 MP4 완성
    """
    import subprocess as _sp
    import datetime

    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filelist = work_dir / "filelist_final.txt"

    with open(filelist, "w", encoding="utf-8") as f:
        for p in clip_paths:
            f.write(f"file '{p.as_posix()}'\n")

    final_out = work_dir / f"final_{ts}.mp4"

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(filelist),
        "-c", "copy",
        str(final_out),
    ]

    print(f"[Final] {len(clip_paths)}개 클립 → {final_out.name}", flush=True)
    r = _sp.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"[Final] concat 실패: {r.stderr[-200:]}", flush=True)
        return None

    kb = final_out.stat().st_size // 1024
    print(f"[Final] 완성: {final_out.name} ({kb}KB)", flush=True)
    return final_out


DEFAULT_NOTEBOOK_ID = "b9d4db2d-bc89-46a6-b5ec-b85579c8dc30"


def _generate_keyframes_nlm(scenes: list[dict], style_id: str, work_dir: Path, art_prompt: str = ""):
    """NLM slide_deck → 씬별 PNG 키프레임 생성."""
    from keyframe_providers import get_provider, SceneRequest

    notebook_id = DEFAULT_NOTEBOOK_ID

    # 전체 씬 progress 상태로 전환
    with _lock:
        for s in scenes:
            s["img_state"] = "progress"

    print(f"[Pipeline] NLM 키프레임 생성 중 ({len(scenes)}개 씬, style={style_id}, art_prompt={len(art_prompt)}자)...", flush=True)

    requests = [
        SceneRequest(index=s["index"], scene_text=s["text"], art_style_id=style_id, art_prompt=art_prompt or None)
        for s in scenes
    ]

    provider = get_provider("nlm", notebook_id=notebook_id)
    paths = provider.generate(requests, work_dir)

    # 결과 반영 + 오버레이 + 썸네일 base64 인코딩
    import base64, io
    from PIL import Image
    from overlay import apply_overlay

    ov = _state["overlay"]

    for scene, path in zip(scenes, paths):
        if path and path.exists() and path.stat().st_size > 10_000:
            try:
                # 오버레이 적용
                final_path = path
                if ov.get("enabled", True):
                    ov_path = path.parent / f"ov_{path.name}"
                    apply_overlay(
                        src_path        = path,
                        dst_path        = ov_path,
                        title           = scene["text"][:20],
                        subtitle        = scene["text"],
                        title_bar_h     = ov.get("title_bar_h", 90),
                        sub_bar_h       = ov.get("sub_bar_h", 90),
                        title_font_size = ov.get("title_font_size", 36),
                        sub_font_size   = ov.get("sub_font_size", 28),
                        title_font      = ov.get("title_font", "malgunbd"),
                        sub_font        = ov.get("sub_font", "malgun"),
                    )
                    final_path = ov_path

                # 썸네일 (오버레이 포함 이미지 기준)
                img = Image.open(final_path).resize((160, 90), Image.LANCZOS)
                buf = io.BytesIO()
                img.save(buf, "JPEG", quality=70)
                b64 = base64.b64encode(buf.getvalue()).decode()
                with _lock:
                    scene["img_state"] = "done"
                    scene["thumb_b64"] = f"data:image/jpeg;base64,{b64}"
                    scene["clip_path"] = str(final_path)
            except Exception as e:
                with _lock:
                    scene["img_state"] = "fail"
                    scene["error"] = str(e)
        else:
            with _lock:
                scene["img_state"] = "fail"
                scene["error"] = "이미지 생성 실패"

    print("[Pipeline] 키프레임 생성 완료", flush=True)


def _generate_dub(scene: dict, voice_id: str, work_dir: Path, speed: float = 1.2):
    """씬 TTS 더빙 생성."""
    with _lock:
        scene["dub_state"] = "progress"

    try:
        from tts_client import synthesize_to_mp3

        voice_map = {
            "injoon": "ko-KR-InJoonNeural",
            "sunhi":  "ko-KR-SunHiNeural",
            "hyunsu": "ko-KR-HyunsuNeural",
        }
        voice = voice_map.get(voice_id, "ko-KR-InJoonNeural")
        mp3_path = work_dir / f"tts_{scene['index']:02d}.mp3"
        srt_path = work_dir / f"tts_{scene['index']:02d}.srt"

        mp3_path, word_timings = synthesize_to_mp3(
            text=scene["text"],
            voice_id=voice,
            output_path=mp3_path,
            speed=speed,
            srt_path=srt_path,
        )

        with _lock:
            scene["dub_state"] = "done"
            scene["clip_path"] = str(mp3_path)
            scene["word_timings"] = word_timings  # Remotion 자막용

    except Exception as e:
        with _lock:
            scene["dub_state"] = "fail"
            scene["error"] = str(e)
        print(f"[Pipeline] 씬{scene['index']+1} 더빙 오류: {e}", flush=True)


# ── 씬별 키프레임 이미지 업로드 ────────────────────────────────────────────────
@app.post("/api/upload-keyframe/{scene_index}")
async def upload_keyframe(scene_index: int, file: UploadFile = File(...)):
    """씬별 키프레임 이미지를 업로드받아 작업 폴더에 저장."""
    with _lock:
        if scene_index >= len(_state["scenes"]):
            return {"ok": False, "error": "씬 인덱스 범위 초과"}
        work_dir = Path(_state.get("work_dir") or (ROOT_DIR / "tmp" / f"job_{int(time.time())}"))
        if not _state.get("work_dir"):
            _state["work_dir"] = str(work_dir)
            _state["job_id"] = work_dir.name

    work_dir.mkdir(parents=True, exist_ok=True)
    out_path = work_dir / f"keyframe_{scene_index:02d}.png"

    content = await file.read()
    # PNG/JPG → PNG 변환 + 1920×1080 리사이즈
    from PIL import Image
    import io, base64
    img = Image.open(io.BytesIO(content))
    img = img.convert("RGB")
    scale = min(1920 / img.width, 1080 / img.height)
    new_w, new_h = int(img.width * scale), int(img.height * scale)
    scaled = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (1920, 1080), (25, 30, 45))
    canvas.paste(scaled, ((1920 - new_w) // 2, (1080 - new_h) // 2))
    canvas.save(str(out_path), "PNG")

    # 썸네일 base64 생성
    thumb = canvas.resize((160, 90), Image.LANCZOS)
    buf = io.BytesIO()
    thumb.save(buf, "JPEG", quality=70)
    b64 = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"

    with _lock:
        scene = _state["scenes"][scene_index]
        scene["img_state"] = "done"
        scene["thumb_b64"] = b64
        scene["clip_path"] = str(out_path)

    kb = out_path.stat().st_size // 1024
    print(f"[Upload] 씬{scene_index+1} 키프레임 업로드: {kb}KB", flush=True)
    return {"ok": True, "scene_index": scene_index, "size_kb": kb, "thumb": b64}


# ── 비주얼타입 JSON 생성 ──────────────────────────────────────────────────────
@app.post("/api/generate-visual-types")
async def generate_visual_types_api(request: Request):
    """현재 시나리오의 씬별 비주얼타입 JSON을 Gemini API로 생성."""
    from visual_type_generator import generate_visual_types

    with _lock:
        scenes = _state["scenes"]
        style_id = _state.get("style_id", "hollywood-sf")
        if not scenes:
            return {"ok": False, "error": "시나리오 없음"}

    # 화풍 라벨
    try:
        styles_data = json.loads(_STYLE_IMAGE_JSON.read_text(encoding="utf-8"))
        mapped_id = _STYLE_ID_MAP.get(style_id, "style9")
        style_obj = next((s for s in styles_data["styles"] if s["id"] == mapped_id), None)
        style_label = style_obj["label"] if style_obj else style_id
    except Exception:
        style_label = style_id

    result = generate_visual_types(scenes, style_label)

    # 상태에 저장
    with _lock:
        _state["visual_types"] = result

    return {"ok": True, "visual_types": result, "style": style_label}


@app.get("/api/visual-types")
def get_visual_types():
    """저장된 비주얼타입 JSON 반환."""
    with _lock:
        vt = _state.get("visual_types", [])
    return {"ok": True, "visual_types": vt}


# ── 배경 이미지 그룹 생성 (3~6개 프롬프트 + 씬 매핑) ─────────────────────────
@app.post("/api/generate-bg-groups")
async def generate_bg_groups_api(request: Request):
    """시나리오 → 3~6개 배경 그룹 + 이미지 프롬프트 생성."""
    from visual_type_generator import generate_bg_groups

    with _lock:
        scenes = _state["scenes"]
        style_id = _state.get("style_id", "hollywood-sf")
        if not scenes:
            return {"ok": False, "error": "시나리오 없음"}

    # 화풍 라벨
    try:
        styles_data = json.loads(_STYLE_IMAGE_JSON.read_text(encoding="utf-8"))
        mapped_id = _STYLE_ID_MAP.get(style_id, "style9")
        style_obj = next((s for s in styles_data["styles"] if s["id"] == mapped_id), None)
        style_label = style_obj["label"] if style_obj else style_id
    except Exception:
        style_label = style_id

    result = generate_bg_groups(scenes, style_label)

    with _lock:
        _state["bg_groups"] = result

    return {"ok": True, **result, "style": style_label}


@app.get("/api/bg-groups")
def get_bg_groups():
    """저장된 배경 그룹 반환."""
    with _lock:
        bg = _state.get("bg_groups", {})
    return {"ok": True, **bg}


# ── 배경 이미지 업로드 (그룹 ID별) ───────────────────────────────────────────
@app.post("/api/upload-bg/{bg_id}")
async def upload_bg_image(bg_id: str, file: UploadFile = File(...)):
    """배경 그룹별 이미지 업로드. bg_1, bg_2, ... 형태."""
    work_dir = Path(_state.get("work_dir") or (ROOT_DIR / "tmp" / f"job_{int(time.time())}"))
    if not _state.get("work_dir"):
        with _lock:
            _state["work_dir"] = str(work_dir)
            _state["job_id"] = work_dir.name
    work_dir.mkdir(parents=True, exist_ok=True)

    out_path = work_dir / f"{bg_id}.png"
    content = await file.read()

    from PIL import Image
    import io, base64
    img = Image.open(io.BytesIO(content)).convert("RGB")
    scale = min(1920 / img.width, 1080 / img.height)
    new_w, new_h = int(img.width * scale), int(img.height * scale)
    scaled = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (1920, 1080), (15, 15, 26))
    canvas.paste(scaled, ((1920 - new_w) // 2, (1080 - new_h) // 2))
    canvas.save(str(out_path), "PNG")

    # Remotion public에도 복사
    remotion_bg = REMOTION_DIR / "public" / "bg"
    remotion_bg.mkdir(parents=True, exist_ok=True)
    import shutil
    shutil.copy2(out_path, remotion_bg / f"{bg_id}.png")

    # 썸네일
    thumb = canvas.resize((160, 90), Image.LANCZOS)
    buf = io.BytesIO()
    thumb.save(buf, "JPEG", quality=70)
    b64 = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"

    kb = out_path.stat().st_size // 1024
    print(f"[BgUpload] {bg_id} 업로드: {kb}KB", flush=True)
    return {"ok": True, "bg_id": bg_id, "size_kb": kb, "thumb": b64}


# ── 화풍 ID → styleimage.json 스타일 매핑 ────────────────────────────────────
_STYLE_IMAGE_JSON = ROOT_DIR / "apps" / "web" / "src" / "data" / "content_styleimage.json"

_STYLE_ID_MAP = {
    "hollywood-sf":   "style9",      # 시네마틱
    "anime-sf":       "style13",     # 애니+실사
    "ghibli-real":    "style8",      # 지브리+실사
    "ink-wash":       "style7",      # 수묵화
    "pixar-3d":       "style3",      # 픽사 3D
    "neo-noir":       "style5",      # 네오 누와르
    "pop-art":        "style11",     # 팝아트
    "reality":        "style6",      # 리얼리티
    "sticker-cutout": "style2",      # 스티커 컷아웃
}

def _load_style_prompt(style_id: str) -> dict:
    """content_styleimage.json에서 구조화된 프롬프트 로드."""
    try:
        data = json.loads(_STYLE_IMAGE_JSON.read_text(encoding="utf-8"))
        mapped_id = _STYLE_ID_MAP.get(style_id, "style9")
        style = next((s for s in data["styles"] if s["id"] == mapped_id), None)
        # 기본 카메라/조명 로드
        cameras = data.get("cameras", [])
        lightings = data.get("lighting", [])
        # 추천 조명
        recommend = style.get("recommend", "") if style else ""
        rec_light = next((l for l in lightings if l["id"] == recommend), None)
        return {
            "style_val": style["val"] if style else "",
            "style_label": style["label"] if style else style_id,
            "negatives": style.get("negatives", "") if style else "",
            "rec_lighting": rec_light["val"] if rec_light else "",
            "cameras": cameras,
        }
    except Exception as e:
        print(f"[Prompt] styleimage.json 로드 실패: {e}", flush=True)
        return {"style_val": "", "style_label": style_id, "negatives": "", "rec_lighting": "", "cameras": []}


# ── 씬별 이미지 프롬프트 생성 ─────────────────────────────────────────────────
@app.get("/api/image-prompts")
def get_image_prompts():
    """content_styleimage.json 기반 구조화된 씬별 프롬프트 반환."""
    with _lock:
        scenes = _state["scenes"]
        style_id = _state.get("style_id", "hollywood-sf")
        if not scenes:
            return {"ok": False, "error": "시나리오 없음"}

    sp = _load_style_prompt(style_id)
    style_val = sp["style_val"]
    negatives = sp["negatives"]
    rec_lighting = sp["rec_lighting"]

    # 기본 카메라: 와이드 샷 (배경 영상용)
    default_camera = "Wide Shot or Long Shot (LS), subject in large environment, scale and context, often captured with a 24mm to 35mm lens"
    # 기본 정책
    env_policy = "Maintain 100% strict adherence to the original environment's composition, layout, color palette, and architectural details."
    base_negative = "looking at camera, eye contact, facing camera, looking at viewer, text, labels, watermark, UI elements"
    combined_negative = f"{base_negative}, {negatives}" if negatives else base_negative

    prompts = []
    for s in scenes:
        text = s["text"].strip()
        # 씬 컨텍스트 추출
        scene_desc = text[:80]

        prompt = ", ".join(filter(None, [
            style_val,
            default_camera,
            rec_lighting,
            f"Scene context: {scene_desc}",
            "16:9 cinematic widescreen composition",
            env_policy,
        ]))
        prompt += f" --no {combined_negative}"

        prompts.append({
            "index": s["index"],
            "prompt": prompt,
            "scene_text": text[:50],
        })

    return {"ok": True, "style": sp["style_label"], "prompts": prompts}


# ── Remotion 영상 렌더링 (비주얼타입 JSON + TTS → MP4) ─────────────────────
REMOTION_DIR = ROOT_DIR / "apps" / "remotion"

@app.post("/api/render-remotion")
def start_render_remotion(background_tasks: BackgroundTasks):
    """비주얼타입 JSON + TTS → Remotion 렌더링 → MP4."""
    with _lock:
        if _state["is_running"]:
            return {"ok": False, "error": "이미 실행 중"}
        scenes = _state["scenes"]
        if not scenes:
            return {"ok": False, "error": "시나리오 없음"}
        _state["is_running"] = True
        _state["final_path"] = None

    background_tasks.add_task(_run_remotion_pipeline)
    return {"ok": True, "message": f"Remotion 렌더링 시작 ({len(scenes)}개 씬)"}


def _run_remotion_pipeline():
    """전체 Remotion 파이프라인: 비주얼타입 → TTS → 렌더 → MP4."""
    _stop_flag.clear()
    try:
        voice_id = _state["voice_id"]
        speed = _state["speed"]
        style_id = _state.get("style_id", "hollywood-sf")
        scenes = _state["scenes"]
        work_dir = Path(_state.get("work_dir") or (ROOT_DIR / "tmp" / f"job_{int(time.time())}"))
        work_dir.mkdir(parents=True, exist_ok=True)
        if not _state.get("work_dir"):
            with _lock:
                _state["work_dir"] = str(work_dir)
                _state["job_id"] = work_dir.name

        print(f"[Remotion] 파이프라인 시작 — {len(scenes)}개 씬, style={style_id}", flush=True)

        # ── Step 1: 비주얼타입 JSON 생성 ─────────────────────────────────
        if is_stopped(): return
        visual_types = _state.get("visual_types", [])
        if not visual_types or len(visual_types) != len(scenes):
            print("[Remotion] 비주얼타입 생성 중...", flush=True)
            from visual_type_generator import generate_visual_types
            visual_types = generate_visual_types(scenes, style_id)
            with _lock:
                _state["visual_types"] = visual_types

        # ── Step 2: TTS 더빙 (MP3 + SRT) ─────────────────────────────────
        print("[Remotion] TTS 더빙 생성 중...", flush=True)
        durations_sec = []
        for scene in scenes:
            if is_stopped(): return
            _generate_dub(scene, voice_id, work_dir, speed)
            # MP3 길이 측정
            mp3_path = work_dir / f"tts_{scene['index']:02d}.mp3"
            dur = _ffprobe_duration(mp3_path) if mp3_path.exists() else 5.0
            durations_sec.append(dur)

        # ── Step 3: Remotion 입력 JSON 생성 ──────────────────────────────
        if is_stopped(): return
        fps = 30
        durations_frames = [max(int(d * fps) + fps, fps * 2) for d in durations_sec]  # 최소 2초, +1초 여유

        # 오디오 파일을 Remotion public 폴더에 복사
        remotion_public = REMOTION_DIR / "public" / "audio"
        remotion_public.mkdir(parents=True, exist_ok=True)
        audio_files = []
        for scene in scenes:
            src = work_dir / f"tts_{scene['index']:02d}.mp3"
            dst = remotion_public / f"tts_{scene['index']:02d}.mp3"
            if src.exists():
                import shutil
                shutil.copy2(src, dst)
                audio_files.append(f"audio/tts_{scene['index']:02d}.mp3")
            else:
                audio_files.append("")

        subtitles = []  # 1차 영상: 자막 없음 (2차 9:16에서 FFmpeg로 추가)

        # 배경 이미지 매핑 (bg_groups → 씬별 배경 파일)
        bg_groups = _state.get("bg_groups", {})
        scene_to_bg = bg_groups.get("scene_to_bg", {})
        bg_images = []
        for scene in scenes:
            bg_id = scene_to_bg.get(scene["index"], scene_to_bg.get(str(scene["index"]), ""))
            if bg_id:
                bg_file = REMOTION_DIR / "public" / "bg" / f"{bg_id}.png"
                bg_images.append(f"bg/{bg_id}.png" if bg_file.exists() else "")
            else:
                bg_images.append("")

        character_id = "c6"  # TODO: 웹에서 캐릭터 선택 전달

        remotion_props = {
            "scenes": visual_types,
            "styleId": style_id,
            "audioFiles": audio_files,
            "durations": durations_frames,
            "subtitles": subtitles,
            "bgImages": bg_images,
            "characterId": character_id,
        }

        props_path = work_dir / "remotion_props.json"
        props_path.write_text(json.dumps(remotion_props, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[Remotion] props JSON 저장: {props_path}", flush=True)

        # ── Step 4: Remotion CLI 렌더링 ──────────────────────────────────
        if is_stopped(): return
        total_frames = sum(durations_frames)
        output_path = work_dir / "final_remotion.mp4"

        print(f"[Remotion] 렌더링 시작... (총 {total_frames}프레임, {total_frames/fps:.0f}초)", flush=True)

        with _lock:
            for s in scenes:
                s["img_state"] = "progress"

        cmd = [
            "npx", "remotion", "render",
            "src/index.ts",
            "LinkDropVideo",
            str(output_path),
            "--props", str(props_path),
            "--codec", "h264",
        ]

        render_result = subprocess.run(
            cmd,
            cwd=str(REMOTION_DIR),
            capture_output=True,
            text=True,
            shell=True,  # Windows에서 npx 경로 해결
            env={**os.environ, "NODE_OPTIONS": "--max-old-space-size=4096"},
        )

        if render_result.returncode != 0:
            print(f"[Remotion] 렌더링 실패: {render_result.stderr[-300:]}", flush=True)
            with _lock:
                for s in scenes:
                    s["img_state"] = "fail"
            return

        if output_path.exists():
            kb = output_path.stat().st_size // 1024
            print(f"[1차 16:9] 렌더링 완료: {output_path.name} ({kb}KB)", flush=True)
            with _lock:
                _state["final_path"] = str(output_path)
                _state["final_path_16x9"] = str(output_path)
                for s in scenes:
                    s["img_state"] = "done"
                    s["dub_state"] = "done"
        else:
            print("[1차 16:9] 출력 파일 없음", flush=True)
            return

        # ── Step 5: 2차 9:16 변환 (자막 포함) ────────────────────────────
        if is_stopped(): return
        print("[2차 9:16] 변환 시작...", flush=True)

        from convert_9x16 import convert_to_9x16
        output_9x16 = work_dir / "final_9x16.mp4"
        text_style = _state.get("text_style", "box")

        result_9x16 = convert_to_9x16(
            input_mp4=output_path,
            output_mp4=output_9x16,
            work_dir=work_dir,
            scene_count=len(scenes),
            text_style=text_style,
        )

        if result_9x16:
            with _lock:
                _state["final_path_9x16"] = str(result_9x16)
            print(f"[2차 9:16] 완료: {result_9x16.name} ({result_9x16.stat().st_size // 1024}KB)", flush=True)
        else:
            print("[2차 9:16] 변환 실패", flush=True)

    except Exception as e:
        print(f"[Pipeline] 오류: {e}", flush=True)
    finally:
        with _lock:
            _state["is_running"] = False
        print("[Pipeline] 전체 완료", flush=True)


# ── 비디오 합성 (이미지 업로드 완료 후, TTS + FFmpeg만 실행) ──────────────────
@app.post("/api/synthesize")
def start_synthesize(background_tasks: BackgroundTasks):
    """업로드된 키프레임 + TTS → FFmpeg 클립 → 최종 영상 합성."""
    with _lock:
        if _state["is_running"]:
            return {"ok": False, "error": "이미 실행 중"}
        scenes = _state["scenes"]
        if not scenes:
            return {"ok": False, "error": "시나리오 없음"}
        work_dir = Path(_state.get("work_dir", ""))
        # 업로드된 키프레임 확인
        uploaded = sum(1 for s in scenes if s["img_state"] == "done")
        if uploaded == 0:
            return {"ok": False, "error": "업로드된 키프레임이 없습니다"}
        _state["is_running"] = True
        _state["final_path"] = None

    background_tasks.add_task(_run_synthesize)
    return {"ok": True, "message": f"비디오 합성 시작 ({uploaded}/{len(scenes)}개 이미지)", "uploaded": uploaded}


def _run_synthesize():
    """키프레임 이미지 → TTS → FFmpeg 합성 (NLM 생성 건너뜀)."""
    _stop_flag.clear()
    try:
        voice_id = _state["voice_id"]
        speed = _state["speed"]
        work_dir = Path(_state["work_dir"])
        scenes = _state["scenes"]

        print(f"[Synthesize] 시작 — {len(scenes)}개 씬, voice={voice_id}", flush=True)

        # TTS 더빙
        for scene in scenes:
            if is_stopped():
                print("[Synthesize] 사용자 중지 (TTS)", flush=True); return
            _generate_dub(scene, voice_id, work_dir, speed)

        # FFmpeg 클립 합성
        if is_stopped():
            print("[Synthesize] 사용자 중지 (클립 합성 전)", flush=True); return
        clip_paths = _generate_clips(scenes, work_dir)

        # 최종 합성
        if is_stopped():
            print("[Synthesize] 사용자 중지 (최종 합성 전)", flush=True); return
        if clip_paths:
            final_path = _merge_final(clip_paths, work_dir)
            if final_path:
                with _lock:
                    _state["final_path"] = str(final_path)
                print(f"[Synthesize] 완성: {final_path}", flush=True)

    except Exception as e:
        print(f"[Synthesize] 오류: {e}", flush=True)
    finally:
        with _lock:
            _state["is_running"] = False
        print("[Synthesize] 완료", flush=True)


# ── 씬 개별 재시도 ────────────────────────────────────────────────────────────
@app.post("/api/retry/{scene_index}")
def retry_scene(scene_index: int, background_tasks: BackgroundTasks):
    with _lock:
        if scene_index >= len(_state["scenes"]):
            return {"ok": False, "error": "씬 인덱스 범위 초과"}
        scene = _state["scenes"][scene_index]
        scene["img_state"] = "wait"
        scene["dub_state"] = "wait"
        scene["thumb_b64"] = None
        scene["error"] = None

    background_tasks.add_task(_retry_single, scene_index)
    return {"ok": True}


def _retry_single(scene_index: int):
    with _lock:
        scene    = _state["scenes"][scene_index]
        style_id = _state["style_id"]
        voice_id = _state["voice_id"]
        work_dir = Path(_state["work_dir"])

    from keyframe_providers import get_provider, SceneRequest

    provider = get_provider("nlm", notebook_id=DEFAULT_NOTEBOOK_ID)
    req = [SceneRequest(index=scene["index"], scene_text=scene["text"], art_style_id=style_id)]

    with _lock:
        scene["img_state"] = "progress"

    paths = provider.generate(req, work_dir)

    import base64, io
    path = paths[0] if paths else None
    if path and path.exists() and path.stat().st_size > 10_000:
        try:
            from PIL import Image
            img = Image.open(path).resize((160, 90), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, "JPEG", quality=70)
            b64 = base64.b64encode(buf.getvalue()).decode()
            with _lock:
                scene["img_state"] = "done"
                scene["thumb_b64"] = f"data:image/jpeg;base64,{b64}"
        except Exception as e:
            with _lock:
                scene["img_state"] = "fail"
                scene["error"] = str(e)
    else:
        with _lock:
            scene["img_state"] = "fail"

    _generate_dub(scene, voice_id, work_dir)


# ── 중지 ─────────────────────────────────────────────────────────────────────
_stop_flag = threading.Event()

@app.post("/api/stop")
def stop_generation():
    with _lock:
        if not _state["is_running"]:
            return {"ok": False, "error": "실행 중이 아닙니다"}
    _stop_flag.set()
    # 최대 5초 대기 후 강제 종료 플래그
    for _ in range(10):
        time.sleep(0.5)
        with _lock:
            if not _state["is_running"]:
                return {"ok": True, "message": "중지 완료"}
    with _lock:
        _state["is_running"] = False
    return {"ok": True, "message": "강제 중지"}


def is_stopped() -> bool:
    """파이프라인 내부에서 중지 요청 확인용."""
    return _stop_flag.is_set()


# ── 캐릭터 캘리브레이션 ────────────────────────────────────────────────────────
@app.get("/api/characters")
def list_characters():
    from calibration_server import list_characters
    return {"ok": True, "characters": list_characters()}


@app.get("/api/calibration/{char_id}")
def get_calibration(char_id: str):
    from calibration_server import get_character_preview
    return get_character_preview(char_id)


@app.post("/api/calibration/{char_id}")
async def save_calibration_api(char_id: str, request: Request):
    body = await request.json()
    from calibration_server import save_calibration
    return save_calibration(char_id, body)


# ── 초기화 ───────────────────────────────────────────────────────────────────
@app.post("/api/reset")
def reset():
    with _lock:
        if _state["is_running"]:
            return {"ok": False, "error": "생성 중 초기화 불가"}
        _state["scenes"] = []
        _state["job_id"] = None
    return {"ok": True}


# ── 기존 작업 불러오기 ────────────────────────────────────────────────────────
@app.post("/api/load")
async def load_job(request: Request):
    body = await request.json()
    """기존 job 폴더에서 keyframe PNG + MP3를 불러와 상태 복원."""
    job_id = body.get("job_id", "")
    work_dir = ROOT_DIR / "tmp" / job_id
    if not work_dir.exists():
        return {"ok": False, "error": f"폴더 없음: {work_dir}"}

    import base64, io
    from PIL import Image

    pngs = sorted(work_dir.glob("keyframe_*.png"))
    if not pngs:
        return {"ok": False, "error": "keyframe PNG 없음"}

    scenes = []
    for path in pngs:
        idx = int(path.stem.split("_")[1])
        # 썸네일 생성
        try:
            img = Image.open(path).resize((160, 90), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, "JPEG", quality=70)
            b64 = base64.b64encode(buf.getvalue()).decode()
            thumb = f"data:image/jpeg;base64,{b64}"
        except Exception:
            thumb = None

        mp3 = work_dir / f"tts_{idx:02d}.mp3"
        scenes.append({
            "index":     idx,
            "text":      f"씬 {idx+1}",
            "img_state": "done",
            "dub_state": "done" if mp3.exists() else "wait",
            "thumb_b64": thumb,
            "clip_path": str(mp3) if mp3.exists() else str(path),
            "error":     None,
        })

    with _lock:
        _state["job_id"]   = job_id
        _state["scenes"]   = scenes
        _state["is_running"] = False
        _state["work_dir"] = str(work_dir)

    return {"ok": True, "job_id": job_id, "total": len(scenes)}


# ── 오버레이 미리보기 ────────────────────────────────────────────────────────
@app.post("/api/preview")
async def preview_overlay(request: Request):
    body = await request.json()
    """샘플 이미지에 오버레이 적용 후 base64 반환."""
    import base64, io as _io
    from PIL import Image
    from overlay import apply_overlay

    title    = body.get("title",    "제목을 여기에 입력하세요")
    subtitle = body.get("subtitle", "자막 첫 번째 줄\n자막 두 번째 줄")
    ov       = body.get("overlay",  {})

    # 샘플 이미지: 1순위 최근 keyframe, 2순위 고정 샘플 이미지
    FIXED_SAMPLE = ROOT_DIR / "apps" / "web" / "public" / "img" / "content" / "longform" / "sample_preview.png"

    sample_path = None
    for tmp_job in sorted((ROOT_DIR / "tmp").glob("job_*/keyframe_00.png"), reverse=True):
        sample_path = tmp_job
        break

    if sample_path is None:
        sample_path = FIXED_SAMPLE if FIXED_SAMPLE.exists() else None

    if sample_path is None:
        return {"ok": False, "error": "샘플 이미지 없음"}

    try:
        tmp_out = ROOT_DIR / "tmp" / "_preview_out.jpg"
        # 프리뷰는 640px 너비로 축소해서 반환.
        # 원본이 1920px → 640px 스케일 = 1/3.
        # 폰트/바 크기를 3배로 적용해야 축소 후 비율이 실제와 일치.
        PREVIEW_SCALE = 3
        apply_overlay(
            src_path        = sample_path,
            dst_path        = tmp_out,
            title           = title,
            subtitle        = subtitle,
            title_bar_h     = ov.get("title_bar_h", 90) * PREVIEW_SCALE,
            sub_bar_h       = ov.get("sub_bar_h", 90) * PREVIEW_SCALE,
            title_font_size = ov.get("title_font_size", 36) * PREVIEW_SCALE,
            sub_font_size   = ov.get("sub_font_size", 28) * PREVIEW_SCALE,
            title_font      = ov.get("title_font", "malgunbd"),
            sub_font        = ov.get("sub_font", "malgun"),
            title_max_chars = ov.get("title_max_chars", 20),
            sub_max_chars   = ov.get("sub_max_chars", 28),
            title_color     = ov.get("title_color", "#ffffff"),
            sub_color       = ov.get("sub_color", "#ffffd2"),
        )
        img_out = Image.open(tmp_out)
        # 640px 너비로 축소
        w, h = img_out.size
        new_w = 640
        new_h = int(h * new_w / w)
        img_out = img_out.resize((new_w, new_h), Image.LANCZOS)
        buf = _io.BytesIO()
        img_out.save(buf, "JPEG", quality=82)
        b64 = base64.b64encode(buf.getvalue()).decode()
        return {"ok": True, "img": f"data:image/jpeg;base64,{b64}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}




# ── 엔트리포인트 ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"[Server] LinkDrop Pipeline Server 시작 (port={7788})", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=7788, log_level="warning")
