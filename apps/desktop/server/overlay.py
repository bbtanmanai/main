#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""키프레임 PNG에 상단 타이틀 + 하단 자막 오버레이."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

from pathlib import Path as _Path

# 프로젝트 폰트 디렉토리 (시스템 폰트 불필요)
_FONT_DIR = _Path(__file__).parent.parent.parent.parent / "apps/web/public/assets/font"

FONT_MAP = {
    # Paperlogy
    "paperlogy-black":     "Paperlogy-9Black.ttf",
    "paperlogy-extrabold": "Paperlogy-8ExtraBold.ttf",
    "paperlogy-bold":      "Paperlogy-7Bold.ttf",
    "paperlogy-semibold":  "Paperlogy-6SemiBold.ttf",
    "paperlogy-medium":    "Paperlogy-5Medium.ttf",
    "paperlogy-regular":   "Paperlogy-4Regular.ttf",
    # Noto
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
    "malgunbd":            "malgunbd.ttf",
    "malgun":              "malgun.ttf",
}

def resolve_font(key: str) -> str:
    filename = FONT_MAP.get(key, "Paperlogy-7Bold.ttf")
    # 1순위: 프로젝트 폰트 폴더
    path = _FONT_DIR / filename
    if path.exists():
        return str(path)
    # 2순위: 시스템 폰트
    sys_path = f"C:/Windows/Fonts/{filename}"
    if _Path(sys_path).exists():
        return sys_path
    # 최종 폴백
    fb = _FONT_DIR / "Paperlogy-7Bold.ttf"
    return str(fb) if fb.exists() else "C:/Windows/Fonts/malgunbd.ttf"


def wrap_text(text: str, max_chars: int) -> list[str]:
    lines = []
    while len(text) > max_chars:
        lines.append(text[:max_chars])
        text = text[max_chars:]
    if text:
        lines.append(text)
    return lines[:2]


def _hex_to_rgb(hex_color: str) -> tuple:
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def apply_overlay(
    src_path: str | Path,
    dst_path: str | Path,
    title: str,
    subtitle: str,
    title_bar_h: int     = 90,
    sub_bar_h: int       = 90,
    title_font_size: int = 36,
    sub_font_size: int   = 28,
    title_font: str      = "malgunbd",
    sub_font: str        = "malgun",
    title_max_chars: int = 20,
    sub_max_chars: int   = 28,
    bg_color: tuple      = (10, 10, 20),
    title_color: str     = "#ffffff",
    sub_color: str       = "#ffffd2",
) -> Path:
    img = Image.open(src_path).convert("RGB")
    iw, ih = img.size

    total_h = title_bar_h + ih + sub_bar_h
    canvas  = Image.new("RGB", (iw, total_h), bg_color)
    canvas.paste(img, (0, title_bar_h))

    draw = ImageDraw.Draw(canvas)
    font_title = ImageFont.truetype(resolve_font(title_font), title_font_size)
    font_sub   = ImageFont.truetype(resolve_font(sub_font),   sub_font_size)

    # ── 상단 타이틀 (바 중앙 정렬) ───────────────────────────────────
    title_lines  = wrap_text(title, title_max_chars)
    line_h_t = title_font_size + 6
    block_h  = len(title_lines) * line_h_t
    y = max(4, (title_bar_h - block_h) // 2)
    tc = _hex_to_rgb(title_color)
    for line in title_lines:
        bbox = draw.textbbox((0, 0), line, font=font_title)
        x = (iw - (bbox[2] - bbox[0])) // 2
        draw.text((x + 2, y + 2), line, font=font_title, fill=(0, 0, 0))
        draw.text((x,     y),     line, font=font_title, fill=tc)
        y += line_h_t

    # ── 하단 자막 (바 중앙 정렬) ─────────────────────────────────────
    sc = _hex_to_rgb(sub_color)
    sub_lines    = wrap_text(subtitle, sub_max_chars)
    line_h_s = sub_font_size + 8
    block_h_s = len(sub_lines) * line_h_s
    sub_top  = title_bar_h + ih
    y = max(sub_top + 4, sub_top + (sub_bar_h - block_h_s) // 2)
    for line in sub_lines:
        bbox = draw.textbbox((0, 0), line, font=font_sub)
        x = (iw - (bbox[2] - bbox[0])) // 2
        draw.text((x + 2, y + 2), line, font=font_sub, fill=(0, 0, 0))
        draw.text((x,     y),     line, font=font_sub, fill=sc)
        y += line_h_s

    out = Path(dst_path)
    canvas.convert("RGB").save(out, "PNG")
    return out
