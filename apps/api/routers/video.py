"""영상 렌더링 API — 키프레임 이미지 + 씬 텍스트 → MP4"""
from fastapi import APIRouter, HTTPException, Form
from fastapi.responses import FileResponse
import asyncio
import json
import os
import shutil
import uuid
import subprocess
from pathlib import Path

router = APIRouter(prefix="/api/v1/video", tags=["Video"])

JOBS_DIR = Path("C:/LinkDropV2/tmp/jobs")
BROWSER_IMAGES = Path("C:/LinkDropV2/tmp/browser_images")
BGM_PATH = Path("C:/LinkDropV2/packages/tools/skill-2-video-longform1/opal-manager/assets/bgm/upbeat_light.mp3")

# 진행률 저장 (메모리, 재시작 시 초기화)
_progress: dict[str, dict] = {}


async def _generate_tts(text: str, output_path: str, voice: str = "ko-KR-SunHiNeural"):
    """edge-tts로 TTS MP3 생성"""
    import edge_tts
    import re
    clean = re.sub(r'\[씬\s*\d+\]', '', text).strip()
    if not clean:
        clean = "내용이 없습니다."
    communicate = edge_tts.Communicate(clean, voice)
    await communicate.save(output_path)


def _make_clip(image_path: str, audio_path: str, output_path: str, fps: int = 25):
    """이미지 + 오디오 → zoompan Ken Burns 클립 생성"""
    # 오디오 길이 측정
    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", audio_path],
        capture_output=True, text=True
    )
    duration = float(json.loads(probe.stdout)["format"]["duration"])
    total_frames = int(duration * fps) + fps  # 여유 1초

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", image_path,
        "-i", audio_path,
        "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.001,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={total_frames}:s=1920x1080:fps={fps}",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest", "-movflags", "+faststart",
        output_path,
    ]
    subprocess.run(cmd, capture_output=True, check=True)


def _concat_clips(clip_paths: list[str], output_path: str, bgm_path: str | None = None):
    """클립 합치기 + BGM 믹싱"""
    list_file = output_path.replace('.mp4', '_list.txt')
    with open(list_file, 'w') as f:
        for p in clip_paths:
            f.write(f"file '{p}'\n")

    if bgm_path and os.path.exists(bgm_path):
        # BGM 믹싱 (원본 볼륨 유지, BGM 20%)
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0", "-i", list_file,
            "-i", bgm_path,
            "-filter_complex", "[0:a][1:a]amix=inputs=2:duration=first:weights=1 0.2[a]",
            "-map", "0:v", "-map", "[a]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            output_path,
        ]
    else:
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0", "-i", list_file,
            "-c:v", "copy", "-c:a", "aac",
            "-movflags", "+faststart",
            output_path,
        ]
    subprocess.run(cmd, capture_output=True, check=True)
    os.remove(list_file)


async def _render_job(job_id: str, job_dir: Path, scenes: list[str], ratio: str):
    """백그라운드 영상 렌더링"""
    try:
        total = len(scenes)
        clip_paths = []

        for i in range(total):
            _progress[job_id] = {"step": "tts", "scene": i + 1, "total": total, "percent": int((i / total) * 80)}

            img_path = str(job_dir / f"scene_{i}.png")
            mp3_path = str(job_dir / f"tts_{i}.mp3")
            clip_path = str(job_dir / f"clip_{i}.mp4")

            if not os.path.exists(img_path):
                continue

            # TTS: voice-dubbing에서 이미 생성된 파일 사용, 없으면 새로 생성
            pre_tts = TTS_DIR / f"tts_{i}.mp3"
            if pre_tts.exists():
                shutil.copy2(str(pre_tts), mp3_path)
            else:
                await _generate_tts(scenes[i], mp3_path)

            # 클립 생성 (동기 FFmpeg → to_thread)
            await asyncio.to_thread(_make_clip, img_path, mp3_path, clip_path)
            clip_paths.append(clip_path)

        if not clip_paths:
            _progress[job_id] = {"step": "error", "message": "생성된 클립이 없습니다", "percent": 0}
            return

        # 합치기
        _progress[job_id] = {"step": "concat", "percent": 85, "total": total, "scene": total}
        final_path = str(job_dir / "final.mp4")
        bgm = str(BGM_PATH) if BGM_PATH.exists() else None
        await asyncio.to_thread(_concat_clips, clip_paths, final_path, bgm)

        _progress[job_id] = {"step": "done", "percent": 100, "total": total, "scene": total, "file": final_path}

    except Exception as e:
        _progress[job_id] = {"step": "error", "message": str(e), "percent": 0}


TTS_DIR = Path("C:/LinkDropV2/tmp/tts")

VOICES_FILE = Path(__file__).resolve().parents[2] / ".." / "apps" / "web" / "src" / "data" / "voice-dubbing.json"


@router.get("/voices")
async def get_voices():
    """사용 가능한 TTS 음성 목록"""
    data = json.loads(VOICES_FILE.read_text(encoding="utf-8"))
    return data["voices"]


SUPERTONE_VOICE_MAP = {
    "andrew": "4653d63d07d5340656b6bc",
}


def _synthesize_supertone_sync(text: str, voice_name: str, output_path: str) -> bool:
    """Supertone API로 TTS 생성 (동기) — 만복 전용"""
    sup_key = os.environ.get("SUPERTONE_API_KEY", "")
    if not sup_key:
        return False
    import httpx as _httpx, tempfile as _tf, re
    clean = re.sub(r'\[씬\s*\d+\]', '', text).strip()
    if not clean:
        return False
    vid = SUPERTONE_VOICE_MAP.get(voice_name.lower(), voice_name)
    url = f"https://supertoneapi.com/v1/text-to-speech/{vid}"
    try:
        r = _httpx.post(url, json={"text": clean, "language": "ko", "style": "neutral", "model": "sona_speech_2"},
                        headers={"x-sup-api-key": sup_key}, timeout=60)
        r.raise_for_status()
        with _tf.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(r.content)
            tmp_wav = tmp.name
        try:
            subprocess.run(["ffmpeg", "-y", "-i", tmp_wav, "-q:a", "2", output_path], capture_output=True, check=True)
        finally:
            Path(tmp_wav).unlink(missing_ok=True)
        return True
    except Exception as e:
        print(f"[Supertone 오류] {e}")
        return False


async def _generate_tts_with_speed(text: str, output_path: str, voice: str = "ko-KR-SunHiNeural", speed: float = 1.0):
    """edge-tts + 속도 조절"""
    import edge_tts
    import re
    clean = re.sub(r'\[씬\s*\d+\]', '', text).strip()
    if not clean:
        clean = "내용이 없습니다."
    rate_pct = int(round((speed - 1.0) * 100))
    rate_str = f"+{rate_pct}%" if rate_pct >= 0 else f"{rate_pct}%"
    communicate = edge_tts.Communicate(clean, voice, rate=rate_str)
    await communicate.save(output_path)


@router.post("/tts")
async def generate_single_tts(
    scene_idx: int = Form(...),
    text: str = Form(...),
    voice: str = Form("ko-KR-SunHiNeural"),
    engine: str = Form("edge-tts"),
    speed: float = Form(1.0),
):
    """씬별 TTS 생성 → MP3"""
    TTS_DIR.mkdir(parents=True, exist_ok=True)
    mp3_path = str(TTS_DIR / f"tts_{scene_idx}.mp3")

    try:
        if engine == "supertone":
            ok = await asyncio.to_thread(_synthesize_supertone_sync, text, voice, mp3_path)
            if not ok:
                await _generate_tts_with_speed(text, mp3_path, speed=speed)
        else:
            await _generate_tts_with_speed(text, mp3_path, voice, speed)
        return {"success": True, "scene_idx": scene_idx}
    except Exception as e:
        raise HTTPException(500, f"TTS 생성 실패: {str(e)}")


@router.get("/tts/{scene_idx}")
async def get_tts_audio(scene_idx: int):
    """생성된 TTS 오디오 조회"""
    mp3_path = TTS_DIR / f"tts_{scene_idx}.mp3"
    if not mp3_path.exists():
        raise HTTPException(404, "TTS 파일 없음")
    return FileResponse(str(mp3_path), media_type="audio/mpeg")


@router.post("/render")
async def start_render(
    scenes_json: str = Form(...),
    ratio: str = Form("16:9"),
):
    """영상 렌더링 시작 — browser_images에서 직접 이미지 사용"""
    scenes = json.loads(scenes_json)

    job_id = str(uuid.uuid4())[:8]
    job_dir = JOBS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    # browser_images에서 job 디렉토리로 복사 (원본 보존)
    missing = []
    for i in range(len(scenes)):
        src = BROWSER_IMAGES / f"scene_{i}.png"
        dst = job_dir / f"scene_{i}.png"
        if src.exists():
            shutil.copy2(str(src), str(dst))
        else:
            missing.append(i)

    if missing:
        raise HTTPException(400, f"씬 {missing} 이미지가 없습니다. 링크브라우저에서 먼저 업로드하세요.")

    _progress[job_id] = {"step": "start", "percent": 0, "total": len(scenes), "scene": 0}

    # 백그라운드 렌더링 시작
    asyncio.create_task(_render_job(job_id, job_dir, scenes, ratio))

    return {"success": True, "job_id": job_id}


@router.get("/status/{job_id}")
async def get_status(job_id: str):
    """렌더링 진행률 조회"""
    if job_id not in _progress:
        raise HTTPException(404, "작업을 찾을 수 없습니다")
    return _progress[job_id]


@router.get("/download/{job_id}")
async def download_video(job_id: str):
    """완성 영상 다운로드"""
    final_path = JOBS_DIR / job_id / "final.mp4"
    if not final_path.exists():
        raise HTTPException(404, "영상 파일이 없습니다")
    return FileResponse(str(final_path), filename=f"linkdrop_{job_id}.mp4", media_type="video/mp4")
