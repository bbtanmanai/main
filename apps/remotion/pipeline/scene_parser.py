#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
씬 파서 — [씬N] 스크립트 → 씬 리스트
======================================
logic.py의 파싱/검증 로직을 Remotion 파이프라인용으로 추출.
TTS는 이미 생성된 MP3를 사용 — 여기서는 타이밍 계산만 담당.
"""
from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

# ── 상수 ──────────────────────────────────────────────────────────────────────
TTS_CHARS_PER_SEC = 4.5   # 한국어 TTS 평균 속도 (글자/초)
MIN_SCENE_COUNT   = 3
MAX_SCENE_COUNT   = 30
MAX_VIDEO_SEC     = 300.0  # 최대 영상 길이 (초)


# ── 데이터 클래스 ──────────────────────────────────────────────────────────────
@dataclass
class SceneData:
    """씬 하나의 완전한 데이터."""
    index: int                        # 0-based
    text: str                         # 나레이션 텍스트
    estimated_sec: float              # 추정 재생 시간 (글자 수 기반)
    tts_path: Optional[Path] = None   # TTS MP3 경로 (이미 생성된 파일)
    tts_duration: float = 0.0         # 실제 TTS 재생 시간 (ffprobe로 측정)
    visual_accent: Optional[dict] = None  # visual_detector 결과


# ── 씬 파싱 ───────────────────────────────────────────────────────────────────
def parse_script(script: str) -> list[SceneData]:
    """
    '[씬N] 텍스트' 형식 스크립트를 SceneData 리스트로 파싱.

    Args:
        script: "[씬1] 텍스트...\n[씬2] 텍스트..." 형식 문자열

    Returns:
        SceneData 리스트 (index 오름차순)
    """
    pattern = re.compile(r"\[씬(\d+)\]\s*(.+?)(?=\[씬\d+\]|$)", re.DOTALL)
    matches = pattern.findall(script)
    if not matches:
        return []

    scenes = []
    for num_str, text in sorted(matches, key=lambda m: int(m[0])):
        text = text.strip()
        if not text:
            continue
        estimated = round(len(text) / TTS_CHARS_PER_SEC, 1)
        scenes.append(SceneData(index=int(num_str) - 1, text=text, estimated_sec=estimated))
    return scenes


def validate_scenes(scenes: list[SceneData]) -> list[SceneData]:
    """
    씬 수 검증 + 자동 트림.
    - 최소 씬 수 미달 시 RuntimeError
    - 최대 씬 수 초과 시 앞 MAX_SCENE_COUNT개만 사용
    - 총 길이 초과 시 뒤에서부터 제거
    """
    if len(scenes) < MIN_SCENE_COUNT:
        raise RuntimeError(f"씬이 너무 적습니다 ({len(scenes)}개, 최소 {MIN_SCENE_COUNT}개)")

    trimmed = list(scenes)
    if len(trimmed) > MAX_SCENE_COUNT:
        trimmed = trimmed[:MAX_SCENE_COUNT]

    total_sec = sum(s.estimated_sec for s in trimmed)
    if total_sec > MAX_VIDEO_SEC:
        while trimmed and total_sec > MAX_VIDEO_SEC:
            removed = trimmed.pop()
            total_sec -= removed.estimated_sec

    return trimmed


# ── TTS 파일 연결 ─────────────────────────────────────────────────────────────
def attach_tts(scenes: list[SceneData], tts_dir: Path) -> list[SceneData]:
    """
    이미 생성된 TTS MP3 파일을 씬에 연결.
    tts_N.mp3 파일이 있으면 tts_path + tts_duration 채움.

    Args:
        scenes: SceneData 리스트
        tts_dir: TTS MP3가 저장된 디렉토리 (기본: C:/LinkDropV2/tmp/tts)
    """
    for scene in scenes:
        mp3 = tts_dir / f"tts_{scene.index}.mp3"
        if mp3.exists():
            scene.tts_path = mp3
            scene.tts_duration = _measure_duration(mp3)
    return scenes


def _measure_duration(mp3: Path) -> float:
    """ffprobe로 MP3 재생 시간 측정 (초)."""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json",
             "-show_format", str(mp3)],
            capture_output=True, text=True, timeout=10
        )
        data = json.loads(result.stdout)
        return float(data["format"]["duration"])
    except Exception:
        return 0.0


# ── 씬 → JSON 직렬화 ─────────────────────────────────────────────────────────
def scenes_to_json(scenes: list[SceneData]) -> list[dict]:
    """
    Remotion defaultProps용 JSON 변환.
    각 씬의 tts_duration을 프레임 수로 변환 (30fps 기준).
    """
    FPS = 30
    result = []
    for s in scenes:
        duration_sec = s.tts_duration if s.tts_duration > 0 else s.estimated_sec
        frames = max(int(duration_sec * FPS) + FPS, 60)  # 최소 2초(60f) 보장
        result.append({
            "index": s.index,
            "text": s.text,
            "duration_frames": frames,
            "tts_path": str(s.tts_path) if s.tts_path else "",
            "visual_accent": s.visual_accent,  # None이면 강조 없음
        })
    return result


# ── CLI 진입점 ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("사용법: python scene_parser.py <script_file.txt> [tts_dir]")
        sys.exit(1)

    script_path = Path(sys.argv[1])
    tts_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("C:/LinkDropV2/tmp/tts")

    script_text = script_path.read_text(encoding="utf-8")
    scenes = parse_script(script_text)
    scenes = validate_scenes(scenes)
    scenes = attach_tts(scenes, tts_dir)

    output = scenes_to_json(scenes)
    print(json.dumps(output, ensure_ascii=False, indent=2))
