"""
Pillow 폴백 키프레임 Provider
================================
그라데이션 배경 PNG 즉시 생성 (< 1초).
외부 의존성 없음 — 항상 성공.
"""
from __future__ import annotations

from pathlib import Path

from .base import KeyframeProvider, SceneRequest

KEYFRAME_W = 1920
KEYFRAME_H = 1080

ART_PALETTES: dict[str, dict] = {
    "hollywood-sf":  {"bg_top": (5, 10, 30),    "bg_bot": (20, 0, 60),    "accent": (0, 200, 255),  "text": (180, 220, 255)},
    "anime-sf":      {"bg_top": (200, 220, 255), "bg_bot": (255, 200, 230),"accent": (100, 60, 200), "text": (50, 30, 100)},
    "ink-wash":      {"bg_top": (245, 240, 230), "bg_bot": (220, 210, 195),"accent": (40, 30, 20),   "text": (30, 25, 15)},
    "pixar-3d":      {"bg_top": (255, 200, 100), "bg_bot": (255, 150, 50), "accent": (255, 80, 20),  "text": (255, 255, 240)},
    "neo-noir":      {"bg_top": (10, 10, 10),    "bg_bot": (30, 5, 5),     "accent": (200, 30, 30),  "text": (220, 220, 220)},
    "pop-art":       {"bg_top": (255, 240, 0),   "bg_bot": (255, 100, 0),  "accent": (220, 0, 100),  "text": (20, 10, 80)},
    "reality":       {"bg_top": (200, 185, 165), "bg_bot": (170, 150, 130),"accent": (80, 60, 40),   "text": (30, 20, 10)},
    "ghibli-real":   {"bg_top": (180, 230, 190), "bg_bot": (150, 200, 240),"accent": (60, 130, 80),  "text": (30, 60, 50)},
    "ghibli-night":  {"bg_top": (10, 2, 30),     "bg_bot": (20, 10, 60),   "accent": (255, 200, 50), "text": (200, 210, 255)},
    "sticker-cutout":{"bg_top": (255, 255, 255), "bg_bot": (240, 240, 255),"accent": (100, 80, 255), "text": (40, 30, 120)},
    "_default":      {"bg_top": (20, 30, 60),    "bg_bot": (10, 10, 30),   "accent": (100, 150, 255),"text": (220, 230, 255)},
}


class PillowKeyframeProvider(KeyframeProvider):

    @property
    def name(self) -> str:
        return "pillow"

    def generate(self, scenes: list[SceneRequest], out_dir: Path) -> list[Path]:
        paths = []
        for scene in scenes:
            path = self._make_one(scene, len(scenes), out_dir)
            paths.append(path)
        return paths

    def _make_one(self, scene: SceneRequest, total: int, out_dir: Path) -> Path:
        from PIL import Image, ImageDraw

        palette = ART_PALETTES.get(scene.art_style_id) or ART_PALETTES["_default"]
        top = palette["bg_top"]
        bot = palette["bg_bot"]
        accent = palette["accent"]

        img = Image.new("RGB", (KEYFRAME_W, KEYFRAME_H))
        draw = ImageDraw.Draw(img)

        # 수직 그라데이션
        for y in range(KEYFRAME_H):
            t = y / KEYFRAME_H
            r = int(top[0] + (bot[0] - top[0]) * t)
            g = int(top[1] + (bot[1] - top[1]) * t)
            b = int(top[2] + (bot[2] - top[2]) * t)
            draw.line([(0, y), (KEYFRAME_W, y)], fill=(r, g, b))

        # 하단 악센트 라인
        draw.rectangle([(0, KEYFRAME_H - 8), (KEYFRAME_W, KEYFRAME_H)], fill=accent)

        # 씬 번호 인디케이터 (우하단)
        dot_r = 6
        spacing = 20
        total_w = total * (dot_r * 2) + (total - 1) * spacing
        start_x = (KEYFRAME_W - total_w) // 2
        y_dot = KEYFRAME_H - 40
        for i in range(total):
            cx = start_x + i * (dot_r * 2 + spacing) + dot_r
            color = accent if i == scene.index else (60, 60, 80)
            draw.ellipse([(cx - dot_r, y_dot - dot_r), (cx + dot_r, y_dot + dot_r)], fill=color)

        out = out_dir / f"keyframe_{scene.index:02d}.png"
        img.save(str(out), "PNG")
        return out
