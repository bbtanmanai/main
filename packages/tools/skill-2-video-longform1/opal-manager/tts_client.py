"""
TTS 클라이언트
==============
Google Cloud TTS REST API (우선) → edge-tts (폴백) 순으로 시도.

사용법:
    from tts_client import synthesize_to_mp3
    path = synthesize_to_mp3("안녕하세요", "ko-KR-Wavenet-D", output_path, api_key)
"""

from __future__ import annotations

import asyncio
import base64
import os
from pathlib import Path
from typing import Optional

import httpx

# ── Google Cloud TTS 음성 → Edge TTS 음성 매핑 ──────────────────────────────
EDGE_VOICE_MAP: dict[str, str] = {
    # Neural2
    "ko-KR-Neural2-A": "ko-KR-SunHiNeural",     # 여성
    "ko-KR-Neural2-B": "ko-KR-SunHiNeural",
    "ko-KR-Neural2-C": "ko-KR-InJoonNeural",     # 남성
    # Wavenet
    "ko-KR-Wavenet-A": "ko-KR-SunHiNeural",
    "ko-KR-Wavenet-B": "ko-KR-SunHiNeural",
    "ko-KR-Wavenet-C": "ko-KR-InJoonNeural",
    "ko-KR-Wavenet-D": "ko-KR-InJoonNeural",
    # Standard
    "ko-KR-Standard-A": "ko-KR-SunHiNeural",
    "ko-KR-Standard-C": "ko-KR-InJoonNeural",
}
DEFAULT_EDGE_VOICE = "ko-KR-SunHiNeural"
TTS_TIMEOUT = 30  # 초


# ── Google Cloud TTS REST API ─────────────────────────────────────────────────

def _synthesize_google(
    text: str,
    voice_id: str,
    output_path: Path,
    api_key: str,
    speed: float = 1.2,
) -> bool:
    """Google Cloud TTS REST API로 MP3 생성. 성공 시 True."""
    payload = {
        "input": {"text": text},
        "voice": {
            "languageCode": "ko-KR",
            "name": voice_id,
        },
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
        audio_bytes = base64.b64decode(r.json()["audioContent"])
        output_path.write_bytes(audio_bytes)
        return True
    except Exception:
        return False


# ── Edge TTS 폴백 ────────────────────────────────────────────────────────────

def _synthesize_edge(
    text: str,
    voice_id: str,
    output_path: Path,
    speed: float = 1.2,
) -> None:
    """edge-tts를 사용해 MP3 생성."""
    import edge_tts

    edge_voice = EDGE_VOICE_MAP.get(voice_id, DEFAULT_EDGE_VOICE)
    # speed 1.0 → "+0%", 1.2 → "+20%", 0.8 → "-20%"
    rate_pct = int(round((speed - 1.0) * 100))
    rate_str = f"+{rate_pct}%" if rate_pct >= 0 else f"{rate_pct}%"

    async def _run() -> None:
        communicate = edge_tts.Communicate(text, edge_voice, rate=rate_str)
        await communicate.save(str(output_path))

    asyncio.run(_run())


# ── 공개 API ─────────────────────────────────────────────────────────────────

def synthesize_to_mp3(
    text: str,
    voice_id: str,
    output_path: Path,
    api_key: Optional[str] = None,
    speed: float = 1.2,
) -> Path:
    """
    씬 텍스트를 MP3로 변환.

    우선순위:
        1. Google Cloud TTS REST API (api_key가 있고 TTS API가 활성화된 경우)
        2. edge-tts (Microsoft Edge Neural TTS)

    Args:
        text:        나레이션 텍스트
        voice_id:    Google TTS 음성 ID (ko-KR-Wavenet-D 등)
        output_path: 저장 경로 (.mp3)
        api_key:     Google API Key (없으면 env에서 로드)

    Returns:
        저장된 MP3 Path
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    resolved_key = api_key or os.environ.get("GOOGLE_API_KEY", "")

    # 1순위: Google Cloud TTS
    if resolved_key:
        if _synthesize_google(text, voice_id, output_path, resolved_key, speed=speed):
            return output_path

    # 2순위: edge-tts
    _synthesize_edge(text, voice_id, output_path, speed=speed)
    return output_path


def get_mp3_duration(mp3_path: Path) -> float:
    """ffprobe로 MP3 재생 시간(초)을 반환."""
    import subprocess, json
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        str(mp3_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        info = json.loads(result.stdout)
        return float(info["format"]["duration"])
    except Exception:
        return 0.0
