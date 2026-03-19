#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
캐릭터 Grid 슬라이싱 v3.0
==========================
5-Grid 체계: mouth(3) + eyes(3) + arm(4) + head(3) + body(대표이미지 크롭)
calibration.json 또는 content_characterimage.json의 좌표 기반.

사용법:
  python scripts/slice_character_grids.py              # 전체 캐릭터
  python scripts/slice_character_grids.py --id c3      # c3만
  python scripts/slice_character_grids.py --id c3 --dry # 실제 저장 없이 확인만
"""

import json
import argparse
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent.parent
CHAR_DIR = ROOT / "apps" / "web" / "public" / "img" / "content" / "character"
JSON_PATH = ROOT / "apps" / "web" / "src" / "data" / "content_characterimage.json"

# 5-Grid 기본 슬라이싱 좌표 (1920×1080 기준)
DEFAULT_CALIBRATION = {
    "mouth_Grid": {
        "panels": {
            "mouth_closed": [0, 0, 640, 1080],
            "mouth_half":   [640, 0, 1280, 1080],
            "mouth_open":   [1280, 0, 1920, 1080],
        }
    },
    "eyes_Grid": {
        "panels": {
            "eyes_open":   [0, 0, 640, 1080],
            "eyes_half":   [640, 0, 1280, 1080],
            "eyes_closed": [1280, 0, 1920, 1080],
        }
    },
    "head_Grid": {
        "panels": {
            "head_front":      [0, 0, 640, 1080],
            "head_tilt_left":  [640, 0, 1280, 1080],
            "head_tilt_right": [1280, 0, 1920, 1080],
        }
    },
    "arm_Grid": {
        "panels": {
            "arm_down":  [0, 0, 480, 1080],
            "arm_half":  [480, 0, 960, 1080],
            "arm_wave":  [960, 0, 1440, 1080],
            "arm_point": [1440, 0, 1920, 1080],
        }
    },
}

GRID_TYPES = ["mouth_Grid", "eyes_Grid", "head_Grid", "arm_Grid"]


def load_characters():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)["characters"]


def load_calibration(char_dir: Path, char: dict) -> dict:
    """캐릭터별 calibration.json 로드. 없으면 기본값."""
    cal_path = char_dir / "calibration.json"
    if cal_path.exists():
        return json.loads(cal_path.read_text(encoding="utf-8"))

    # content_characterimage.json의 calibration 사용
    cal = char.get("calibration", {})
    if cal:
        # v2.0 형식 → v3.0 형식 변환
        result = {}
        if "mouth" in cal:
            result["mouth_Grid"] = cal["mouth"]
        if "body" in cal:
            result["body_Grid"] = cal["body"]
        return result

    return DEFAULT_CALIBRATION


def slice_grid(grid_path: Path, panels: dict, output_dir: Path, dry: bool = False) -> list[str]:
    """Grid 이미지를 panels 좌표 또는 균등 분할로 크롭."""
    if not grid_path.exists():
        print(f"  ⚠ Grid 없음: {grid_path.name}")
        return []

    img = Image.open(grid_path)
    w, h = img.size
    panel_count = len(panels)

    results = []
    for i, name in enumerate(panels.keys()):
        # 균등 분할 (이미지 실제 크기 기반)
        col_w = w // panel_count
        box = (col_w * i, 0, col_w * (i + 1), h)

        out_path = output_dir / f"{name}.png"
        if dry:
            print(f"  [DRY] {grid_path.name} ({w}×{h}) → {name}.png  crop={list(box)}")
            results.append(name)
            continue

        panel = img.crop(box)
        panel.save(out_path)
        kb = out_path.stat().st_size // 1024
        print(f"  ✅ {name}.png ({panel.size[0]}×{panel.size[1]}, {kb}KB)")
        results.append(name)

    return results


def process_character(char: dict, dry: bool = False):
    cid = char["id"]
    char_dir = CHAR_DIR / cid

    if not char_dir.exists():
        print(f"[{cid}] 폴더 없음 → 건너뜀")
        return

    cal = load_calibration(char_dir, char)
    print(f"\n[{cid}] {char.get('name', cid)} — {char_dir}")

    total = 0
    for grid_type in GRID_TYPES:
        grid_cal = cal.get(grid_type, DEFAULT_CALIBRATION.get(grid_type, {}))
        panels = grid_cal.get("panels", {})
        if not panels:
            continue

        grid_path = char_dir / f"{cid}_{grid_type}.png"
        results = slice_grid(grid_path, panels, char_dir, dry)
        total += len(results)

    print(f"  총 {total}개 파츠 슬라이싱 {'(DRY)' if dry else '완료'}")


def main():
    parser = argparse.ArgumentParser(description="캐릭터 5-Grid 슬라이싱 v3.0")
    parser.add_argument("--id", default=None, help="특정 캐릭터만 (예: c3)")
    parser.add_argument("--dry", action="store_true", help="실제 저장 없이 확인만")
    args = parser.parse_args()

    characters = load_characters()

    if args.id:
        chars = [c for c in characters if c["id"] == args.id]
        if not chars:
            print(f"캐릭터 {args.id} 없음")
            return
    else:
        chars = characters

    print(f"슬라이싱 대상: {len(chars)}개 캐릭터 (v3.0 — 5-Grid)")
    if args.dry:
        print("(DRY RUN)\n")

    for char in chars:
        process_character(char, args.dry)

    print("\n완료!")


if __name__ == "__main__":
    main()
