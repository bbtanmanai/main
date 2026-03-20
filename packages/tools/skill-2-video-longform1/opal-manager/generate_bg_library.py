#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FLUX Schnell 배경 이미지 라이브러리 사전 생성 + R2 업로드

사용법:
  python generate_bg_library.py                    # 전체 화풍 × 200장
  python generate_bg_library.py ghibli-real 10     # 특정 화풍 10장만
  python generate_bg_library.py --resume           # 이미 업로드된 것 건너뛰고 이어서

비용: $0.003/장 × 200장 × 17화풍 = $10.2 총비용
"""
import sys, os, time
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent.parent.parent
sys.path.insert(0, str(ROOT / "packages/tools/skill-2-video-longform1/opal-manager"))
sys.path.insert(0, str(ROOT / "packages/tools/skill-2-video-longform1/opal-manager/keyframe_providers"))

for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

from flux_provider import generate_scene_bg
from r2_client import upload_bg, exists, count_bgs

# ── 대상 화풍 목록 ────────────────────────────────────────────────────────────
ALL_STYLES = [
    "ghibli-real",
    "ghibli-night",
    "anime-sf",
    "pixar-3d",
    "reality",
    "health-senior-1",
    "health-senior-2",
    "tech-trend-1",
    "tech-trend-2",
    "stock-news-1",
    "stock-news-2",
    "news-anchor",
    "economy-global",
    "wisdom-quotes-1",
    "wisdom-quotes-2",
    "lifestyle-1",
    "lifestyle-2",
]

IMAGES_PER_STYLE = 200
WORK_DIR = ROOT / "tmp" / "bg_library_gen"
WORK_DIR.mkdir(parents=True, exist_ok=True)

resume_mode = "--resume" in sys.argv

# CLI 인수 파싱
target_styles = ALL_STYLES
target_count  = IMAGES_PER_STYLE

if len(sys.argv) >= 2 and not sys.argv[1].startswith("--"):
    target_styles = [sys.argv[1]]
    target_count  = int(sys.argv[2]) if len(sys.argv) >= 3 else IMAGES_PER_STYLE

# ── 실행 ─────────────────────────────────────────────────────────────────────
total_uploaded = 0
total_skipped  = 0
total_failed   = 0
t_start = time.time()

print(f"[배경 라이브러리 생성]")
print(f"  화풍: {len(target_styles)}종 × {target_count}장 = {len(target_styles)*target_count}장")
print(f"  예상 비용: ${len(target_styles)*target_count*0.003:.2f}")
print(f"  Resume: {resume_mode}\n")

for style_id in target_styles:
    existing = count_bgs(style_id) if resume_mode else 0
    print(f"[{style_id}] 기존 {existing}장 → {target_count}장 목표")

    for idx in range(target_count):
        # resume 모드: 이미 R2에 있으면 건너뜀
        if resume_mode and exists(style_id, idx):
            total_skipped += 1
            continue

        local_path = WORK_DIR / style_id / f"{idx:03d}.png"
        local_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            # FLUX 생성 (seed = style별 base + index)
            seed_base = abs(hash(style_id)) % 9000 + 1000
            path = generate_scene_bg(
                art_style_id=style_id,
                scene_index=idx,
                out_dir=local_path.parent,
                scene_text="",
                seed=seed_base + idx,
            )
            # R2 업로드
            upload_bg(path, style_id, idx)
            total_uploaded += 1
            print(f"  [{style_id}] {idx+1}/{target_count} ✅")

        except Exception as e:
            print(f"  [{style_id}] {idx+1}/{target_count} ❌ {e}")
            total_failed += 1

        # API 레이트 리밋 방지 (0.5초 간격)
        time.sleep(0.5)

    print()

elapsed = time.time() - t_start
print(f"[완료]")
print(f"  업로드: {total_uploaded}장")
print(f"  건너뜀: {total_skipped}장")
print(f"  실패:   {total_failed}장")
print(f"  소요:   {elapsed/60:.1f}분")
print(f"  비용:   ${total_uploaded*0.003:.3f}")
