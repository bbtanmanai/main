#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2차 9:16 영상 변환
==================
1차 16:9 MP4 → 9:16 (1080×1920) + 자막 번인.

구조:
  ┌──────────────────┐
  │  블러 배경 (확대) │
  │  ┌──────────────┐│
  │  │ 원본 16:9    ││  ← 상단 30% 위치
  │  │ 영상         ││
  │  └──────────────┘│
  │                  │
  │  [자막 텍스트]    │  ← 하단 안전구역
  └──────────────────┘
"""

import subprocess
import json
from pathlib import Path


def _find_font() -> str:
    """한글 폰트 경로 (FFmpeg drawtext용)."""
    ROOT = Path(__file__).parent.parent.parent.parent
    candidates = [
        ROOT / "apps/web/public/assets/font/Paperlogy-7Bold.ttf",
        ROOT / "apps/web/public/assets/font/NotoSansKR-VF.ttf",
        Path("C:/Windows/Fonts/malgunbd.ttf"),
    ]
    for f in candidates:
        if f.exists():
            return str(f).replace("\\", "/")
    return ""


def _font_esc(path: str) -> str:
    """FFmpeg filter용 경로 이스케이프."""
    p = path.replace("\\", "/")
    if len(p) > 1 and p[1] == ":":
        p = p[0] + "\\:" + p[2:]
    return p


def _escape_text(text: str) -> str:
    """FFmpeg drawtext 텍스트 이스케이프."""
    text = text.replace("\\", "\\\\")
    text = text.replace("'", "\u2019")
    text = text.replace(":", "\\:")
    text = text.replace("[", "\\[").replace("]", "\\]")
    text = text.replace("%", "%%")
    return text


def _parse_srt_files(work_dir: Path, scene_count: int) -> list[dict]:
    """SRT 파일들을 파싱하여 타이밍 + 텍스트 목록 반환."""
    subtitles = []
    cumulative_offset = 0.0

    for i in range(scene_count):
        srt_path = work_dir / f"tts_{i:02d}.srt"
        mp3_path = work_dir / f"tts_{i:02d}.mp3"

        # MP3 길이
        duration = 5.0
        try:
            probe = subprocess.run(
                ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", str(mp3_path)],
                capture_output=True, text=True,
            )
            duration = float(json.loads(probe.stdout)["format"]["duration"])
        except Exception:
            pass

        if srt_path.exists():
            content = srt_path.read_text(encoding="utf-8").strip()
            blocks = content.split("\n\n")
            for block in blocks:
                lines = block.strip().split("\n")
                if len(lines) >= 3:
                    # 타임코드 파싱
                    time_line = lines[1]
                    text = " ".join(lines[2:])
                    try:
                        start_str, end_str = time_line.split(" --> ")
                        start_sec = _srt_to_sec(start_str.strip()) + cumulative_offset
                        end_sec = _srt_to_sec(end_str.strip()) + cumulative_offset
                        subtitles.append({"start": start_sec, "end": end_sec, "text": text})
                    except Exception:
                        pass
        else:
            # SRT 없으면 전체 구간에 씬 텍스트 사용은 건너뜀
            pass

        cumulative_offset += duration + 0.5  # 씬 간 0.5초 여유 (Remotion 프레임 여유와 일치)

    return subtitles


def _srt_to_sec(ts: str) -> float:
    """SRT 타임코드(HH:MM:SS,mmm) → 초."""
    ts = ts.replace(",", ".")
    parts = ts.split(":")
    return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])


def convert_to_9x16(
    input_mp4: Path,
    output_mp4: Path,
    work_dir: Path,
    scene_count: int,
    text_style: str = "box",
) -> Path | None:
    """
    1차 16:9 MP4 → 2차 9:16 MP4 (블러 배경 + 원본 + 자막).

    Args:
        input_mp4:   1차 영상 경로
        output_mp4:  2차 출력 경로
        work_dir:    작업 디렉터리 (SRT 파일 위치)
        scene_count: 씬 수
        text_style:  자막 스타일 ("box" 또는 "outline")

    Returns:
        출력 경로 또는 None
    """
    if not input_mp4.exists():
        print(f"[9x16] 입력 파일 없음: {input_mp4}", flush=True)
        return None

    font_path = _find_font()
    if not font_path:
        print("[9x16] 한글 폰트 없음", flush=True)
        return None

    fe = _font_esc(font_path)

    # 자막 파싱
    subtitles = _parse_srt_files(work_dir, scene_count)
    print(f"[9x16] 자막 {len(subtitles)}개 로드", flush=True)

    # FFmpeg 필터 구성
    # 1. 블러 배경 (원본 확대 + 가우시안 블러)
    # 2. 원본 영상 (상단 12% ~ 중앙)
    # 3. 자막 (하단 안전구역)
    W, H = 1080, 1920
    video_h = int(W * 9 / 16)  # 원본 비율 유지 = 608px
    video_y = int(H * 0.12)     # 상단 12% 아래

    filter_parts = [
        # 배경: 원본 확대 → 블러
        f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=20:5[bg]",
        # 원본: 리사이즈
        f"[0:v]scale={W}:{video_h}[main]",
        # 합성: 배경 + 원본
        f"[bg][main]overlay=0:{video_y}[comp]",
    ]

    # 자막 drawtext 체인
    last_label = "comp"
    for i, sub in enumerate(subtitles):
        safe_text = _escape_text(sub["text"][:40])  # 최대 40자
        label_out = f"sub{i}"

        if text_style == "box":
            dt = (
                f"drawtext=fontfile='{fe}':"
                f"text='{safe_text}':"
                f"fontsize=42:fontcolor=white:"
                f"box=1:boxcolor=black@0.6:boxborderw=14:"
                f"x=(w-tw)/2:y=h-th-180:"
                f"enable='between(t,{sub['start']:.2f},{sub['end']:.2f})'"
            )
        else:  # outline
            dt = (
                f"drawtext=fontfile='{fe}':"
                f"text='{safe_text}':"
                f"fontsize=42:fontcolor=white:"
                f"shadowcolor=black:shadowx=2:shadowy=2:"
                f"x=(w-tw)/2:y=h-th-180:"
                f"enable='between(t,{sub['start']:.2f},{sub['end']:.2f})'"
            )

        filter_parts.append(f"[{last_label}]{dt}[{label_out}]")
        last_label = label_out

    filter_complex = ";".join(filter_parts)

    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_mp4),
        "-filter_complex", filter_complex,
        "-map", f"[{last_label}]",
        "-map", "0:a?",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        str(output_mp4),
    ]

    print(f"[9x16] FFmpeg 변환 시작... ({len(subtitles)}개 자막)", flush=True)

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"[9x16] FFmpeg 실패: {result.stderr[-300:]}", flush=True)
        return None

    if output_mp4.exists():
        kb = output_mp4.stat().st_size // 1024
        print(f"[9x16] 완료: {output_mp4.name} ({kb}KB)", flush=True)
        return output_mp4

    return None


if __name__ == "__main__":
    # 테스트
    work = Path("C:/LinkDropV2/tmp/job_1773877391")
    inp = work / "final_remotion.mp4"
    out = work / "final_9x16.mp4"
    result = convert_to_9x16(inp, out, work, 20)
    if result:
        print(f"성공: {result}")
