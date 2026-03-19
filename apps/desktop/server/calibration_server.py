#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
캐릭터 캘리브레이션 API
======================
프로그램에서 캐릭터 이미지 위에 파츠 좌표를 지정하고 calibration.json에 저장.
"""

import json
import base64
import io
from pathlib import Path
from PIL import Image

ROOT_DIR = Path(__file__).parent.parent.parent.parent
CHAR_DIR = ROOT_DIR / "apps" / "web" / "public" / "img" / "content" / "character"


def list_characters() -> list[dict]:
    """캐릭터 목록 반환."""
    json_path = ROOT_DIR / "apps" / "web" / "src" / "data" / "content_characterimage.json"
    try:
        data = json.loads(json_path.read_text(encoding="utf-8"))
        return [{"id": c["id"], "name": c["name"]} for c in data["characters"]]
    except Exception:
        return []


def get_character_preview(char_id: str) -> dict:
    """캐릭터 대표이미지 + 기존 캘리브레이션 반환."""
    char_dir = CHAR_DIR / char_id
    img_path = char_dir / f"{char_id}.png"

    if not img_path.exists():
        return {"ok": False, "error": f"캐릭터 이미지 없음: {char_id}"}

    # 이미지 → base64 (640px 리사이즈)
    img = Image.open(img_path)
    w, h = img.size
    new_w = 640
    new_h = int(h * new_w / w)
    resized = img.resize((new_w, new_h), Image.LANCZOS)

    buf = io.BytesIO()
    resized.save(buf, "PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()

    # 기존 캘리브레이션 로드
    cal_path = char_dir / "calibration.json"
    cal = {}
    if cal_path.exists():
        cal = json.loads(cal_path.read_text(encoding="utf-8"))

    # 그리드 파일 존재 여부
    grids = {}
    for grid_type in ["mouth_Grid", "eyes_Grid", "head_Grid", "arm_Grid"]:
        grid_path = char_dir / f"{char_id}_{grid_type}.png"
        grids[grid_type] = grid_path.exists()

    return {
        "ok": True,
        "char_id": char_id,
        "image": f"data:image/png;base64,{b64}",
        "image_size": [w, h],
        "preview_size": [new_w, new_h],
        "calibration": cal,
        "grids": grids,
    }


def save_calibration(char_id: str, calibration: dict) -> dict:
    """캘리브레이션 데이터를 JSON으로 저장."""
    char_dir = CHAR_DIR / char_id
    if not char_dir.exists():
        return {"ok": False, "error": f"캐릭터 폴더 없음: {char_id}"}

    cal_path = char_dir / "calibration.json"
    cal_path.write_text(
        json.dumps(calibration, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"[Calibration] {char_id} 저장: {cal_path}", flush=True)
    return {"ok": True, "path": str(cal_path)}
