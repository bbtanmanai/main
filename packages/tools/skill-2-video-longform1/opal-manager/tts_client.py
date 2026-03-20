"""
TTS 클라이언트
==============
우선순위:
  1. Supertone API  (voice_id가 SUPERTONE_VOICE_MAP에 있거나 "supertone:" 접두사)
  2. Google Cloud TTS REST API
  3. edge-tts (폴백)

사용법:
    from tts_client import synthesize_to_mp3
    synthesize_to_mp3("안녕하세요", "andrew", output_path, speed=1.2)
    synthesize_to_mp3("안녕하세요", "injoon",  output_path, speed=1.2)  # edge-tts 폴백
"""

from __future__ import annotations

import asyncio
import base64
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

import httpx

# ── Supertone 성우 이름 → voice_id 매핑 ──────────────────────────────────────
SUPERTONE_VOICE_MAP: dict[str, str] = {
    "andrew": "4653d63d07d5340656b6bc",
    # 추가 성우: "이름소문자": "voice_id"
}

# ── 캐릭터 ID → 성우 매핑 (캐릭터 = 성우 지정) ───────────────────────────────
CHARACTER_VOICE_MAP: dict[str, str] = {
    "c13": "andrew",    # Supertone Andrew (남성, 영어 억양)
    "c6":  "injoon",    # edge-tts InJoon (남성, 한국어)
    "c3":  "sunhi",     # edge-tts SunHi  (여성, 한국어)
    # 추가 캐릭터: "cN": "성우이름"
}
DEFAULT_CHARACTER_VOICE = "injoon"


def get_voice_for_character(character_id: str) -> str:
    """캐릭터 ID로 지정된 성우 반환. 미등록 시 기본값."""
    return CHARACTER_VOICE_MAP.get(character_id, DEFAULT_CHARACTER_VOICE)
SUPERTONE_BASE_URL = "https://supertoneapi.com/v1/text-to-speech"
SUPERTONE_MODEL    = "sona_speech_2"
SUPERTONE_STYLE    = "neutral"
SUPERTONE_TIMEOUT  = 60  # 초

# ── Google Cloud TTS 음성 → Edge TTS 음성 매핑 ──────────────────────────────
EDGE_VOICE_MAP: dict[str, str] = {
    "ko-KR-Neural2-A":  "ko-KR-SunHiNeural",
    "ko-KR-Neural2-B":  "ko-KR-SunHiNeural",
    "ko-KR-Neural2-C":  "ko-KR-InJoonNeural",
    "ko-KR-Wavenet-A":  "ko-KR-SunHiNeural",
    "ko-KR-Wavenet-B":  "ko-KR-SunHiNeural",
    "ko-KR-Wavenet-C":  "ko-KR-InJoonNeural",
    "ko-KR-Wavenet-D":  "ko-KR-InJoonNeural",
    "ko-KR-Standard-A": "ko-KR-SunHiNeural",
    "ko-KR-Standard-C": "ko-KR-InJoonNeural",
    "injoon":           "ko-KR-InJoonNeural",
    "sunhi":            "ko-KR-SunHiNeural",
}
DEFAULT_EDGE_VOICE = "ko-KR-InJoonNeural"
TTS_TIMEOUT = 30


def _ms_to_srt(ms: int) -> str:
    h = ms // 3600000
    m = (ms % 3600000) // 60000
    s = (ms % 60000) // 1000
    r = ms % 1000
    return f"{h:02d}:{m:02d}:{s:02d},{r:03d}"


# ── 1순위: Supertone API ──────────────────────────────────────────────────────

def _synthesize_supertone(
    text: str,
    voice_name: str,
    output_path: Path,
    api_key: str,
    language: str = "ko",
    style: str = SUPERTONE_STYLE,
    srt_path: Optional[Path] = None,
) -> bool:
    """
    Supertone API로 WAV 생성 후 ffmpeg으로 MP3 변환.
    성공 시 True + SRT(문장 전체 구간) 생성.
    """
    vid = SUPERTONE_VOICE_MAP.get(voice_name.lower(), voice_name)
    url = f"{SUPERTONE_BASE_URL}/{vid}"
    payload = {
        "text":     text,
        "language": language,
        "style":    style,
        "model":    SUPERTONE_MODEL,
    }
    try:
        with httpx.Client(timeout=SUPERTONE_TIMEOUT) as client:
            r = client.post(url, json=payload, headers={"x-sup-api-key": api_key})
            r.raise_for_status()

        wav_bytes = r.content
        # WAV → MP3 (ffmpeg)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(wav_bytes)
            tmp_wav = tmp.name
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-i", tmp_wav, "-q:a", "2", str(output_path)],
                capture_output=True, check=True,
            )
        finally:
            Path(tmp_wav).unlink(missing_ok=True)

        # SRT: 오디오 전체 구간을 1개 블록으로 생성
        if srt_path and output_path.exists():
            dur_ms = _get_duration_ms(output_path)
            srt_content = (
                f"1\n"
                f"{_ms_to_srt(100)} --> {_ms_to_srt(dur_ms - 50)}\n"
                f"{text}\n\n"
            )
            Path(srt_path).write_text(srt_content, encoding="utf-8")

        return True
    except Exception as e:
        print(f"    [Supertone 오류] {e}")
        return False


def _get_duration_ms(path: Path) -> int:
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
            capture_output=True, text=True,
        )
        return int(float(r.stdout.strip()) * 1000)
    except Exception:
        return 5000


# ── 2순위: Google Cloud TTS ───────────────────────────────────────────────────

def _synthesize_google(
    text: str,
    voice_id: str,
    output_path: Path,
    api_key: str,
    speed: float = 1.2,
) -> bool:
    payload = {
        "input": {"text": text},
        "voice": {"languageCode": "ko-KR", "name": voice_id},
        "audioConfig": {
            "audioEncoding": "MP3",
            "speakingRate": max(0.25, min(4.0, speed)),
            "pitch": 0.0,
        },
    }
    try:
        with httpx.Client(timeout=TTS_TIMEOUT) as client:
            r = client.post(
                "https://texttospeech.googleapis.com/v1/text:synthesize",
                json=payload,
                headers={"X-goog-api-key": api_key},
            )
            r.raise_for_status()
        output_path.write_bytes(base64.b64decode(r.json()["audioContent"]))
        return True
    except Exception:
        return False


# ── 3순위: edge-tts 폴백 ─────────────────────────────────────────────────────

def _synthesize_edge(
    text: str,
    voice_id: str,
    output_path: Path,
    speed: float = 1.2,
    srt_path: Optional[Path] = None,
) -> list[dict]:
    import edge_tts

    edge_voice = EDGE_VOICE_MAP.get(voice_id, DEFAULT_EDGE_VOICE)
    rate_pct = int(round((speed - 1.0) * 100))
    rate_str = f"+{rate_pct}%" if rate_pct >= 0 else f"{rate_pct}%"
    word_timings: list[dict] = []

    async def _run() -> None:
        communicate = edge_tts.Communicate(text, edge_voice, rate=rate_str)
        with open(str(output_path), "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                    offset_ms  = chunk["offset"] // 10000
                    duration_ms = chunk["duration"] // 10000
                    word_timings.append({
                        "offset_ms": offset_ms,
                        "duration_ms": duration_ms,
                        "text": chunk["text"],
                    })
        if srt_path and word_timings:
            lines = []
            for i, t in enumerate(word_timings):
                s, e = t["offset_ms"], t["offset_ms"] + t["duration_ms"]
                lines += [f"{i+1}", f"{_ms_to_srt(s)} --> {_ms_to_srt(e)}", t["text"], ""]
            Path(srt_path).write_text("\n".join(lines), encoding="utf-8")

    asyncio.run(_run())
    return word_timings


# ── 공개 API ──────────────────────────────────────────────────────────────────

def synthesize_to_mp3(
    text: str,
    voice_id: str,
    output_path,
    api_key: Optional[str] = None,
    speed: float = 1.2,
    srt_path=None,
) -> tuple[Path, list[dict]]:
    """
    텍스트 → MP3 변환.

    우선순위:
        1. Supertone API  (voice_id가 supertone 성우 이름인 경우)
        2. Google TTS
        3. edge-tts

    Args:
        voice_id: "andrew" → Supertone | "injoon" → edge-tts | "ko-KR-Wavenet-D" → Google
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if srt_path:
        srt_path = Path(srt_path)

    # 1순위: Supertone
    sup_key = os.environ.get("SUPERTONE_API_KEY", "")
    is_supertone = voice_id.lower() in SUPERTONE_VOICE_MAP or voice_id.startswith("supertone:")
    if sup_key and is_supertone:
        clean_name = voice_id.replace("supertone:", "").lower()
        if _synthesize_supertone(text, clean_name, output_path, sup_key, srt_path=srt_path):
            return output_path, []

    # 2순위: Google TTS
    google_key = api_key or os.environ.get("GOOGLE_API_KEY", "")
    if google_key and voice_id.startswith("ko-KR-"):
        if _synthesize_google(text, voice_id, output_path, google_key, speed=speed):
            return output_path, []

    # 3순위: edge-tts
    if srt_path is None:
        srt_path = output_path.with_suffix(".srt")
    timings = _synthesize_edge(text, voice_id, output_path, speed=speed, srt_path=srt_path)
    return output_path, timings


def get_mp3_duration(mp3_path: Path) -> float:
    import json as _json
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", str(mp3_path)],
        capture_output=True, text=True,
    )
    try:
        return float(_json.loads(result.stdout)["format"]["duration"])
    except Exception:
        return 0.0
