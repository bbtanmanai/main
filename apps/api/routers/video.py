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

import logging
logger = logging.getLogger(__name__)

from pydantic import BaseModel
from typing import Any


class SceneRenderData(BaseModel):
    index: int
    text: str
    accents: list[Any] = []
    subtitle_chunks: list[Any] = []
    tts_duration: float = 5.0
    has_image: bool = True
    has_mp4: bool = False


class RenderRemotionRequest(BaseModel):
    scenes: list[SceneRenderData]
    ratio: str = "16:9"
    accent_color: str = "#6366f1"
    video_title: str = ""


router = APIRouter(prefix="/api/v1/video", tags=["Video"])

_PROJECT_ROOT = Path(__file__).resolve().parents[3]
JOBS_DIR = _PROJECT_ROOT / "tmp" / "jobs"
BROWSER_IMAGES = _PROJECT_ROOT / "tmp" / "browser_images"
OUTPUT_DIR = _PROJECT_ROOT / "output"
BGM_PATH = _PROJECT_ROOT / "packages" / "tools" / "skill-2-video-longform1" / "opal-manager" / "assets" / "bgm" / "upbeat_light.mp3"

# 진행률 저장 (메모리, 재시작 시 초기화)
_progress: dict[str, dict] = {}


def _attach_word_spaces(word_events: list, clean_text: str) -> list:
    """WordBoundary 결과에 원본 텍스트 기반 공백 suffix 추가.
    edge-tts event["text"]는 공백 없이 단어만 반환하므로,
    원본 clean_text에서 각 단어 뒤 공백 여부를 확인해 word 끝에 붙인다."""
    import re as _re
    result = []
    search_pos = 0
    for ev in word_events:
        word = ev["word"]
        idx = clean_text.find(word, search_pos)
        if idx == -1:
            result.append(ev)
            continue
        after = idx + len(word)
        search_pos = after
        # 단어 뒤 문자가 공백이면 suffix 추가
        suffix = ' ' if after < len(clean_text) and clean_text[after] == ' ' else ''
        result.append({**ev, "word": word + suffix})
    return result


async def _generate_tts(text: str, output_path: str, voice: str = "ko-KR-SunHiNeural"):
    """edge-tts로 TTS MP3 + 단어 타이밍 JSON 생성"""
    import edge_tts, re, json as _json
    from pathlib import Path as _Path
    clean = re.sub(r'\[씬\s*\d+\]', '', text).strip()
    if not clean:
        clean = "내용이 없습니다."
    communicate = edge_tts.Communicate(clean, voice)
    audio_chunks, sentence_events = [], []
    async for event in communicate.stream():
        if event["type"] == "audio":
            audio_chunks.append(event["data"])
        elif event["type"] == "SentenceBoundary":
            sentence_events.append(event)
    word_events = _sentence_boundary_to_words(sentence_events)
    with open(output_path, "wb") as f:
        for chunk in audio_chunks:
            f.write(chunk)
    words_path = _Path(output_path).with_name(_Path(output_path).stem + "_words.json")
    words_path.write_text(_json.dumps(_attach_word_spaces(word_events, clean), ensure_ascii=False), encoding="utf-8")


def _make_clip(image_path: str, audio_path: str, output_path: str, fps: int = 25, ratio: str = "16:9"):
    """이미지 + 오디오 → zoompan Ken Burns 클립 생성"""
    # 오디오 길이 측정
    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", audio_path],
        capture_output=True, text=True
    )
    duration = float(json.loads(probe.stdout)["format"]["duration"])
    total_frames = int(duration * fps) + fps  # 여유 1초

    if ratio == "9:16":
        w, h = 1080, 1920
    else:
        w, h = 1920, 1080

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", image_path,
        "-i", audio_path,
        "-vf", f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.001,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={total_frames}:s={w}x{h}:fps={fps}",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest", "-movflags", "+faststart",
        output_path,
    ]
    subprocess.run(cmd, capture_output=True, check=True)


def _concat_clips(clip_paths: list[str], output_path: str, bgm_path: str | None = None):
    """클립 합치기 + BGM 믹싱"""
    list_file = output_path.replace('.mp4', '_list.txt')
    with open(list_file, 'w', encoding='utf-8') as f:
        for p in clip_paths:
            # Windows 역슬래시 → 슬래시 (FFmpeg concat demuxer 요구사항)
            f.write(f"file '{p.replace(chr(92), '/')}'\n")

    if bgm_path and os.path.exists(bgm_path):
        # BGM 믹싱 (원본 볼륨 유지, BGM 20%)
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0", "-i", list_file,
            "-i", bgm_path,
            "-filter_complex", "[0:v]format=yuv420p[v];[0:a][1:a]amix=inputs=2:duration=first:weights=1 0.2[a]",
            "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709", "-color_primaries", "bt709",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            output_path,
        ]
    else:
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0", "-i", list_file,
            "-vf", "format=yuv420p",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709", "-color_primaries", "bt709",
            "-c:a", "aac",
            "-movflags", "+faststart",
            output_path,
        ]
    subprocess.run(cmd, capture_output=True, check=True)
    os.remove(list_file)


def _hex_to_libass_bgr(hex_color: str) -> str:
    """#RRGGBB → libass &H00BBGGRR 변환"""
    h = hex_color.lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H00{b.upper()}{g.upper()}{r.upper()}"


def _embed_subtitles(input_video: str, srt_path: str, output_path: str,
                     accent_color: str = '#6366f1', ratio: str = '16:9'):
    """SRT를 영상 픽셀에 burn-in (하드코딩) — 모든 플레이어/SNS에서 항상 표시.
    accent_color: 테두리 색상 (Remotion SubtitleBar accentColor와 동일)
    ratio: 영상 비율 — MarginV를 Remotion SubtitleBar bottomMargin에 맞게 계산
    실패 시 자막 없이 복사.
    """
    # Remotion SubtitleBar bottomMargin 일치:
    #   16:9 → height=1080, bottomMargin = round(1080*0.11) = 119px
    #   9:16 → height=1920, bottomMargin = round(1920*0.22) = 422px
    # libass 기본 PlayResY=288 기준, 출력 해상도로 나누어 역산
    if ratio == '9:16':
        video_h = 1920
        video_w = 1080
        remotion_margin = round(video_h * 0.22)   # 422px
        libass_scale = min(video_w / 384, video_h / 288)   # 2.8125
    else:  # 16:9
        video_h = 1080
        video_w = 1920
        remotion_margin = round(video_h * 0.11)   # 119px
        libass_scale = min(video_w / 384, video_h / 288)   # 3.75
    margin_v = round(remotion_margin / libass_scale)

    # Windows 경로 문제 회피: job 디렉토리에서 상대경로로 FFmpeg 실행
    work_dir = str(Path(srt_path).parent)
    srt_name = Path(srt_path).name
    in_name  = Path(input_video).name
    out_name = Path(output_path).name
    outline_color = _hex_to_libass_bgr(accent_color)
    style = (
        f"FontName=Malgun Gothic,FontSize=18,PrimaryColour=&H00FFFFFF,"
        f"OutlineColour={outline_color},Outline=3,Shadow=1,Alignment=2,"
        f"MarginV={margin_v},Bold=1"
    )
    cmd = [
        "ffmpeg", "-y",
        "-i", in_name,
        "-vf", f"subtitles={srt_name}:force_style='{style}'",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "copy",
        "-movflags", "+faststart",
        out_name,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=work_dir)
    if result.returncode != 0:
        logger.warning("[_embed_subtitles] burn-in 실패, 자막 없이 복사: %s", result.stderr[-400:])
        shutil.copy2(input_video, output_path)


def _generate_scene_srt(scene_idx: int, job_dir: Path, output_path: str):
    """단일 씬 local-timing SRT 생성 (오프셋 없음)"""
    words_file = job_dir / f"tts_{scene_idx}_words.json"
    if not words_file.exists():
        return
    try:
        words = json.loads(words_file.read_text(encoding="utf-8"))
    except Exception:
        return
    if not words:
        return

    CHUNK_CHARS = 16
    lines = []
    sub_idx = 1
    chunk_words: list = []
    chunk_start = None

    for w in words:
        if chunk_start is None:
            chunk_start = w["start"]
        chunk_words.append(w)
        chunk_text = "".join(cw["word"] for cw in chunk_words).strip()
        is_last = (w is words[-1])
        if len(chunk_text) >= CHUNK_CHARS or is_last:
            lines.append(str(sub_idx))
            lines.append(f"{_sec_to_srt(chunk_start)} --> {_sec_to_srt(w['end'])}")
            lines.append(chunk_text)
            lines.append("")
            sub_idx += 1
            chunk_words = []
            chunk_start = None

    Path(output_path).write_text("\ufeff" + "\n".join(lines), encoding="utf-8")


def _sec_to_srt(sec: float) -> str:
    """초 → SRT 타임코드 HH:MM:SS,mmm"""
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    ms = int(round((sec - int(sec)) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _generate_srt(scenes: list, tts_dir: Path, output_path: str, scene_indices: list | None = None):
    """씬별 TTS words.json → 누적 타이밍 SRT 자막 생성.
    scene_indices: 실제 파일명 인덱스 (이미지 없어 skip된 씬 제외 후 원본 인덱스 목록)
    """
    import re
    lines = []
    sub_idx = 1
    offset = 0.0
    CHUNK_CHARS = 16  # 한글 기준 한 자막 줄 최대 글자 수

    for i, scene in enumerate(scenes):
        actual_idx = scene_indices[i] if scene_indices and i < len(scene_indices) else i
        text = scene.get("text", "") if isinstance(scene, dict) else str(scene)
        clean = re.sub(r'\[씬\s*\d+\]', '', text).strip()
        words_file = tts_dir / f"tts_{actual_idx}_words.json"

        scene_duration = 0.0

        if words_file.exists():
            try:
                words = json.loads(words_file.read_text(encoding="utf-8"))
            except Exception:
                words = []

            if words:
                # 단어를 CHUNK_CHARS 단위로 묶어 자막 생성
                chunk_words = []
                chunk_start = None
                for w in words:
                    if chunk_start is None:
                        chunk_start = w["start"]
                    chunk_words.append(w)
                    chunk_text = "".join(cw["word"] for cw in chunk_words).strip()
                    is_last = (w == words[-1])
                    if len(chunk_text) >= CHUNK_CHARS or is_last:
                        end_sec = w["end"]
                        lines.append(str(sub_idx))
                        lines.append(f"{_sec_to_srt(offset + chunk_start)} --> {_sec_to_srt(offset + end_sec)}")
                        lines.append(chunk_text)
                        lines.append("")
                        sub_idx += 1
                        chunk_words = []
                        chunk_start = None
                scene_duration = words[-1]["end"]

        offset += scene_duration + 0.3  # 씬 간 0.3초 간격

    Path(output_path).write_text("\ufeff" + "\n".join(lines), encoding="utf-8")


async def _render_job(job_id: str, job_dir: Path, scenes: list, ratio: str, accent_color: str = '#6366f1'):
    """백그라운드 영상 렌더링 — 씬별 자막 임베드 후 concat"""
    import logging, traceback
    from datetime import datetime
    try:
        total = len(scenes)
        clip_paths = []          # 자막 포함 완성 클립
        effective_scenes = []    # clip_paths 와 1:1
        effective_indices = []   # 원본 씬 인덱스 (words.json 파일명 기준)
        ratio_label = "9x16" if ratio == "9:16" else "16x9"

        # output 날짜 폴더 생성
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_dir = OUTPUT_DIR / f"{ts}_{ratio_label}"
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "tts").mkdir(exist_ok=True)
        (out_dir / "images").mkdir(exist_ok=True)

        for i, scene in enumerate(scenes):
            _progress[job_id] = {
                "step": f"씬{i+1} 처리 중", "scene": i + 1, "total": total,
                "percent": int((i / total) * 85),
            }

            scene_text = scene.get("text", "") if isinstance(scene, dict) else str(scene)
            img_path = str(job_dir / f"scene_{i}.png")
            mp3_path = str(job_dir / f"tts_{i}.mp3")
            raw_clip  = str(job_dir / f"raw_{i}.mp4")   # 자막 없는 원본 클립
            clip_path = str(job_dir / f"clip_{i}.mp4")  # 자막 임베드 완성 클립

            if not os.path.exists(img_path):
                continue

            # TTS: 기존 파일 우선 사용
            pre_tts = TTS_DIR / f"tts_{i}.mp3"
            if pre_tts.exists():
                shutil.copy2(str(pre_tts), mp3_path)
                pre_words = TTS_DIR / f"tts_{i}_words.json"
                words_valid = (
                    pre_words.exists()
                    and json.loads(pre_words.read_text(encoding="utf-8") or "[]")
                )
                if words_valid:
                    shutil.copy2(str(pre_words), str(job_dir / f"tts_{i}_words.json"))
                else:
                    # words.json 없거나 빈 배열이면 edge-tts로 단어 타이밍 재추출
                    await _save_edge_words_for_timing(scene_text, mp3_path)
            else:
                await _generate_tts(scene_text, mp3_path)

            # 씬 SRT 생성 (local timing — 씬 시작 = 0)
            scene_srt = str(job_dir / f"scene_{i}.srt")
            _generate_scene_srt(i, job_dir, scene_srt)

            # 원본 클립 생성 (ratio 적용)
            await asyncio.to_thread(_make_clip, img_path, mp3_path, raw_clip, 25, ratio)

            # 자막 임베드 → 완성 클립
            scene_srt_exists = Path(scene_srt).exists() and Path(scene_srt).stat().st_size > 5
            if scene_srt_exists:
                await asyncio.to_thread(_embed_subtitles, raw_clip, scene_srt, clip_path, accent_color, ratio)
            else:
                shutil.copy2(raw_clip, clip_path)
            Path(raw_clip).unlink(missing_ok=True)

            if not Path(clip_path).exists():
                logger.warning(f"씬 {i} clip_path 미생성, 건너뜀: {clip_path}")
                continue
            clip_paths.append(clip_path)
            effective_scenes.append(scene)
            effective_indices.append(i)

            # output 폴더에 TTS / 이미지 복사
            shutil.copy2(mp3_path, str(out_dir / "tts" / f"tts_{i}.mp3"))
            shutil.copy2(img_path, str(out_dir / "images" / f"scene_{i}.png"))

        if not clip_paths:
            _progress[job_id] = {"step": "error", "message": "생성된 클립이 없습니다", "percent": 0}
            return

        # 누적 SRT 저장 (output 폴더용 — 전체 타임라인)
        _progress[job_id] = {"step": "자막 생성 중", "percent": 88, "total": total, "scene": total}
        srt_path = str(out_dir / "subtitles.srt")
        await asyncio.to_thread(_generate_srt, effective_scenes, job_dir, srt_path, effective_indices)

        # 클립 concat + BGM 믹싱 → final.mp4
        _progress[job_id] = {"step": "영상 합체 중", "percent": 93, "total": total, "scene": total}
        final_path = str(out_dir / "final.mp4")
        bgm = str(BGM_PATH) if BGM_PATH.exists() else None
        await asyncio.to_thread(_concat_clips, clip_paths, final_path, bgm)

        _progress[job_id] = {
            "step": "done", "percent": 100, "total": total, "scene": total,
            "file": final_path, "output_dir": str(out_dir),
        }

    except Exception as e:
        logging.error("[render_job] 오류: %s\n%s", e, traceback.format_exc())
        _progress[job_id] = {"step": "error", "message": str(e), "percent": 0}


TTS_DIR = _PROJECT_ROOT / "tmp" / "tts"

VOICES_FILE = _PROJECT_ROOT / "apps" / "web" / "src" / "data" / "voice-dubbing.json"

# Node.js / render-scene.mjs 경로
_RENDER_SCRIPT = _PROJECT_ROOT / "apps" / "web" / "scripts" / "render-scene.mjs"
_WEB_DIR = _PROJECT_ROOT / "apps" / "web"


async def _render_scene_remotion(
    scene: "SceneRenderData",
    job_dir: Path,
    ratio: str,
    accent_color: str,
    video_title: str,
    semaphore: asyncio.Semaphore,
) -> "str | None":
    """단일 씬을 Remotion renderMedia()로 MP4 렌더 — 세마포어로 동시 실행 수 제한"""
    async with semaphore:
        i = scene.index
        composition_id = "AccentScene-9x16" if ratio == "9:16" else "AccentScene-16x9"
        img_url   = f"http://localhost:8000/api/v1/browser/images/{i}"
        audio_url = f"http://localhost:8000/api/v1/browser/audio/{i}"

        props = {
            "accents":        scene.accents,
            "tts_duration":   scene.tts_duration,
            "bgImage":        img_url,
            "videoTitle":     video_title,
            "audioSrc":       audio_url,
            "accentColor":    accent_color,
            "subtitleChunks": scene.subtitle_chunks,
            "simple":         False,
        }

        props_file  = job_dir / f"scene_{i}_props.json"
        output_file = job_dir / f"clip_{i}.mp4"
        props_file.write_text(json.dumps(props, ensure_ascii=False), encoding="utf-8")

        cmd = [
            "node", str(_RENDER_SCRIPT),
            "--props",       str(props_file),
            "--output",      str(output_file),
            "--composition", composition_id,
        ]

        logger.info("[remotion] 씬%d 렌더 시작: %s", i, composition_id)
        result = await asyncio.to_thread(
            subprocess.run, cmd, capture_output=True, text=True, cwd=str(_WEB_DIR)
        )
        if result.returncode != 0:
            logger.error("[remotion] 씬%d 렌더 실패:\n%s", i, result.stderr[-800:])
            return None

        logger.info("[remotion] 씬%d 렌더 완료: %s", i, output_file)
        return str(output_file) if output_file.exists() else None


async def _render_job_remotion(
    job_id: str, job_dir: Path, req: "RenderRemotionRequest"
):
    """Remotion 기반 병렬 씬 렌더 → FFmpeg concat → final.mp4"""
    import traceback
    from datetime import datetime
    try:
        total = len(req.scenes)
        ratio_label = "9x16" if req.ratio == "9:16" else "16x9"

        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_dir = OUTPUT_DIR / f"{ts}_{ratio_label}"
        out_dir.mkdir(parents=True, exist_ok=True)

        _progress[job_id] = {"step": "렌더 준비 중", "percent": 2, "total": total, "scene": 0}

        # 세마포어: 동시 최대 3씬 병렬 렌더
        semaphore = asyncio.Semaphore(3)

        # 유효 씬만 필터 (이미지 있는 씬)
        valid_scenes = [s for s in req.scenes if s.has_image and not s.has_mp4]

        render_tasks = [
            _render_scene_remotion(s, job_dir, req.ratio, req.accent_color, req.video_title, semaphore)
            for s in valid_scenes
        ]

        # 진행률 업데이트 태스크와 병렬 실행
        done_count = 0

        async def track(coro, scene_idx):
            nonlocal done_count
            result = await coro
            done_count += 1
            _progress[job_id] = {
                "step": f"씬 렌더 중 ({done_count}/{len(valid_scenes)})",
                "percent": int(5 + (done_count / len(valid_scenes)) * 80),
                "total": total,
                "scene": done_count,
            }
            return result

        clip_results = await asyncio.gather(*[
            track(t, valid_scenes[i].index) for i, t in enumerate(render_tasks)
        ])

        clip_paths = [p for p in clip_results if p is not None]

        if not clip_paths:
            _progress[job_id] = {"step": "error", "message": "렌더된 클립이 없습니다", "percent": 0}
            return

        _progress[job_id] = {"step": "영상 합체 중", "percent": 88, "total": total, "scene": total}
        final_path = str(out_dir / "final.mp4")
        bgm = str(BGM_PATH) if BGM_PATH.exists() else None
        await asyncio.to_thread(_concat_clips, clip_paths, final_path, bgm)

        _progress[job_id] = {
            "step": "done", "percent": 100, "total": total, "scene": total,
            "file": final_path, "output_dir": str(out_dir),
        }

    except Exception as e:
        logger.error("[render_job_remotion] 오류: %s\n%s", e, traceback.format_exc())
        _progress[job_id] = {"step": "error", "message": str(e), "percent": 0}


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


def _sentence_boundary_to_words(sentences: list) -> list:
    """SentenceBoundary 이벤트 목록 → 어절별 균등 타이밍 word 리스트."""
    words = []
    for s in sentences:
        seg_start = s["offset"] / 10_000_000
        seg_end   = (s["offset"] + s["duration"]) / 10_000_000
        tokens = s["text"].split()
        if not tokens:
            continue
        dur_per = (seg_end - seg_start) / len(tokens)
        for i, tok in enumerate(tokens):
            words.append({
                "word":  tok,
                "start": round(seg_start + i * dur_per, 3),
                "end":   round(seg_start + (i + 1) * dur_per, 3),
            })
    return words


async def _generate_tts_with_speed(text: str, output_path: str, voice: str = "ko-KR-SunHiNeural", speed: float = 1.0):
    """edge-tts + 속도 조절 + 단어 타이밍 JSON 생성"""
    import edge_tts, json as _json
    from pathlib import Path as _Path
    import re
    clean = re.sub(r'\[씬\s*\d+\]', '', text).strip()
    if not clean:
        clean = "내용이 없습니다."
    rate_pct = int(round((speed - 1.0) * 100))
    rate_str = f"+{rate_pct}%" if rate_pct >= 0 else f"{rate_pct}%"
    communicate = edge_tts.Communicate(clean, voice, rate=rate_str)
    audio_chunks, sentence_events = [], []
    async for event in communicate.stream():
        if event["type"] == "audio":
            audio_chunks.append(event["data"])
        elif event["type"] == "SentenceBoundary":
            sentence_events.append(event)
    word_events = _sentence_boundary_to_words(sentence_events)
    with open(output_path, "wb") as f:
        for chunk in audio_chunks:
            f.write(chunk)
    words_path = _Path(output_path).with_name(_Path(output_path).stem + "_words.json")
    words_path.write_text(_json.dumps(_attach_word_spaces(word_events, clean), ensure_ascii=False), encoding="utf-8")


async def _save_edge_words_for_timing(text: str, output_mp3_path: str,
                                      edge_voice: str = "ko-KR-SunHiNeural"):
    """Supertone 사용 시 edge-tts로 단어 타이밍만 추출 — MP3는 버리고 _words.json만 저장.
    타이밍은 edge-tts 기준이므로 browser.py에서 실제 Supertone 길이로 스케일 조정됨."""
    import edge_tts, json as _json
    from pathlib import Path as _Path
    import re
    clean = re.sub(r'\[씬\s*\d+\]', '', text).strip()
    if not clean:
        return
    try:
        communicate = edge_tts.Communicate(clean, edge_voice)
        sentence_events = []
        async for event in communicate.stream():
            if event["type"] == "SentenceBoundary":
                sentence_events.append(event)
        word_events = _sentence_boundary_to_words(sentence_events)
        if word_events:
            words_path = _Path(output_mp3_path).with_name(
                _Path(output_mp3_path).stem + "_words.json"
            )
            words_path.write_text(_json.dumps(_attach_word_spaces(word_events, clean), ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        logger.warning("[_save_edge_words_for_timing] 실패 path=%s err=%s", output_mp3_path, e)


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
            # Supertone(음질) + edge-tts(타이밍 추출) 병렬 실행
            ok, _ = await asyncio.gather(
                asyncio.to_thread(_synthesize_supertone_sync, text, voice, mp3_path),
                _save_edge_words_for_timing(text, mp3_path),
            )
            if not ok:
                # Supertone 실패 → edge-tts 폴백 (이미 _words.json도 생성됨)
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
    accent_color: str = Form("#6366f1"),
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
    asyncio.create_task(_render_job(job_id, job_dir, scenes, ratio, accent_color))

    return {"success": True, "job_id": job_id}


@router.post("/render-remotion")
async def start_render_remotion(req: RenderRemotionRequest):
    """Remotion renderMedia() 기반 영상 렌더링 — 미리보기와 동일한 결과물 생성"""
    job_id = str(uuid.uuid4())[:8]
    job_dir = JOBS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    _progress[job_id] = {"step": "start", "percent": 0, "total": len(req.scenes), "scene": 0}
    asyncio.create_task(_render_job_remotion(job_id, job_dir, req))

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
    # output_dir이 progress에 있으면 우선 사용
    job_info = _progress.get(job_id, {})
    output_dir = job_info.get("output_dir")
    if output_dir:
        final_path = Path(output_dir) / "final.mp4"
    else:
        final_path = JOBS_DIR / job_id / "final.mp4"
    if not final_path.exists():
        raise HTTPException(404, "영상 파일이 없습니다")
    return FileResponse(str(final_path), filename=f"linkdrop_{job_id}.mp4", media_type="video/mp4")
