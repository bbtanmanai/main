#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Opal A1 키프레임 이미지 테스트
================================
두 가지 방식을 모두 테스트하여 결과물을 비교합니다.

  방식 A: generateWebpageStream → CSS/SVG HTML → Playwright PNG
  방식 B: executeStep (gemini-3-pro-image-preview) → blob 다운로드 → PNG

사용법:
  python test_opal_keyframe.py                         # 두 방식 모두
  python test_opal_keyframe.py --mode html             # HTML 방식만
  python test_opal_keyframe.py --mode image            # AI 이미지 방식만
  python test_opal_keyframe.py --scene "혈압 낮추는 식품" --style ghibli-real
"""

import sys
import os
import asyncio
import argparse
from pathlib import Path

# ── 경로 설정 ──────────────────────────────────────────────────────────────
_OPAL_MGR  = Path(__file__).parent
_OPAL_API  = Path("C:/LinkDropV2/apps/api/services")
_OPAL_AUTH = Path(__file__).parent.parent / "opal-access"

for p in [str(_OPAL_MGR), str(_OPAL_API), str(_OPAL_AUTH)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# .env 로드
for _env in [
    _OPAL_MGR.parent.parent.parent.parent / ".env",
]:
    if _env.exists():
        for line in _env.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
        break


# ══════════════════════════════════════════════════════════════════
# 방식 A: HTML → Playwright PNG
# ══════════════════════════════════════════════════════════════════

async def test_html_mode(scene_text: str, art_style: str, out_dir: Path) -> Path | None:
    """generateWebpageStream → HTML → Playwright 스크린샷."""
    from opal_client import opal_client

    print("\n" + "=" * 60)
    print("【방식 A】 generateWebpageStream → HTML → Playwright PNG")
    print("=" * 60)

    scene_input = (
        f"Create a single self-contained HTML page that fills exactly 1920×1080px "
        f"with a full-screen cinematic BACKGROUND VISUAL only. "
        f"Art style: {art_style}. "
        f"Theme/mood: {scene_text}. "
        f"STRICT RULES: "
        f"1. NO text, NO labels, NO titles anywhere — zero visible characters. "
        f"2. Use ONLY CSS gradients, SVG shapes, or canvas animations. NO img tags. "
        f"3. No external CDN, fully self-contained. "
        f"4. body: width:1920px; height:1080px; margin:0; overflow:hidden. "
        f"5. Deep, rich, broadcast-quality colors. "
        f"Output ONLY the complete HTML document starting with <!DOCTYPE html>."
    )

    print(f"  씬 텍스트: {scene_text}")
    print(f"  화풍: {art_style}")
    print("  API 호출 중...")

    html = await opal_client.generate_html_slide(
        intent="",
        scene_text=scene_input,
        debug=False,
    )

    if not html or not ("<html" in html.lower() or "<!doctype" in html.lower()):
        print(f"  [실패] HTML 응답 없음 (길이: {len(html)})")
        return None

    print(f"  [성공] HTML 수신 ({len(html):,}자)")

    out_dir.mkdir(parents=True, exist_ok=True)
    html_path = out_dir / "A_slide.html"
    html_path.write_text(html, encoding="utf-8")
    print(f"  HTML 저장: {html_path}")

    # Playwright 스크린샷
    png_path = out_dir / "A_keyframe.png"
    try:
        import threading

        def _screenshot():
            from playwright.sync_api import sync_playwright
            with sync_playwright() as pw:
                browser = pw.chromium.launch()
                page = browser.new_page(viewport={"width": 1920, "height": 1080})
                page.goto(html_path.as_uri())
                page.wait_for_timeout(1500)
                page.screenshot(path=str(png_path), full_page=False)
                browser.close()
            print(f"  PNG 저장: {png_path} ({png_path.stat().st_size // 1024}KB)")

        t = threading.Thread(target=_screenshot)
        t.start()
        t.join(timeout=30)
        return png_path if png_path.exists() else None

    except ImportError:
        print("  [알림] Playwright 미설치 — HTML만 저장됨")
        print("         pip install playwright && playwright install chromium")
        return None
    except Exception as e:
        print(f"  [오류] Playwright 실패: {e}")
        return None


# ══════════════════════════════════════════════════════════════════
# 방식 B: executeStep → AI 이미지 blob 다운로드
# ══════════════════════════════════════════════════════════════════

async def test_image_mode(scene_text: str, art_style: str, out_dir: Path) -> Path | None:
    """executeStep gemini-3-pro-image-preview → blob 다운로드 → PNG."""
    from opal_client import opal_client

    print("\n" + "=" * 60)
    print("【방식 B】 executeStep AI 이미지 → blob 다운로드 → PNG")
    print("=" * 60)

    # 씬 텍스트 → 이미지 생성 프롬프트 조합
    image_prompt = (
        f"Art style: {art_style}. "
        f"Cinematic background scene: {scene_text}. "
        f"Full-screen 16:9 keyframe image. No text, no captions. "
        f"Deep, vivid, broadcast-quality colors."
    )

    print(f"  씬 텍스트: {scene_text}")
    print(f"  화풍: {art_style}")
    print("  executeStep API 호출 중 (gemini-3-pro-image-preview)...")

    result = await opal_client.execute_step_image(
        scene_text=image_prompt,
        aspect_ratio="16:9",
    )

    if not result:
        print("  [실패] executeStep 응답 없음")
        print("         → 모델 할당량 초과 또는 인증 만료일 수 있습니다")
        return None

    gcs_path, proxy_url = result
    print(f"  [성공] GCS 경로: {gcs_path}")
    print(f"         Proxy URL: {proxy_url}")
    print("  blob 이미지 다운로드 중...")

    out_dir.mkdir(parents=True, exist_ok=True)
    png_path = out_dir / "B_keyframe.png"

    ok = await opal_client.download_blob_image(proxy_url, png_path)
    if not ok:
        print("  [실패] blob 다운로드 실패")
        print(f"         직접 확인: {proxy_url}")
        return None

    size_kb = png_path.stat().st_size // 1024
    print(f"  PNG 저장: {png_path} ({size_kb}KB)")

    # 이미지 크기 확인
    try:
        from PIL import Image
        img = Image.open(png_path)
        print(f"  이미지 크기: {img.width} × {img.height}px")
        if img.width != 1920 or img.height != 1080:
            print(f"  [주의] 목표 크기(1920×1080)와 다름 → 리사이즈 필요")
    except Exception:
        pass

    return png_path


# ══════════════════════════════════════════════════════════════════
# 메인
# ══════════════════════════════════════════════════════════════════

async def main_async(scene: str, style: str, mode: str, out_dir: Path) -> None:
    results = {}

    if mode in ("all", "html"):
        path = await test_html_mode(scene, style, out_dir)
        results["A (HTML)"] = str(path) if path else "실패"

    if mode in ("all", "image"):
        path = await test_image_mode(scene, style, out_dir)
        results["B (AI 이미지)"] = str(path) if path else "실패"

    print("\n" + "=" * 60)
    print("【결과 요약】")
    for label, val in results.items():
        print(f"  {label}: {val}")
    print(f"\n  출력 폴더: {out_dir}")
    print("=" * 60)


def main() -> None:
    parser = argparse.ArgumentParser(description="Opal A1 키프레임 테스트")
    parser.add_argument("--scene", default="혈압을 낮추는 시니어 건강 식품 TOP5",
                        help="씬 텍스트 (기본: 혈압 건강 주제)")
    parser.add_argument("--style", default="ghibli-real",
                        choices=["ghibli-real", "hollywood-sf", "anime-sf",
                                 "ink-wash", "pixar-3d", "neo-noir",
                                 "pop-art", "reality", "sticker-cutout"],
                        help="화풍 ID")
    parser.add_argument("--mode", default="all",
                        choices=["all", "html", "image"],
                        help="테스트 방식 (기본: all — 두 방식 모두)")
    parser.add_argument("--outdir", default="C:/LinkDropV2/opal_test",
                        help="출력 폴더")
    args = parser.parse_args()

    print(f"Opal A1 키프레임 테스트")
    print(f"  씬:  {args.scene}")
    print(f"  화풍: {args.style}")
    print(f"  모드: {args.mode}")
    print(f"  출력: {args.outdir}")

    asyncio.run(main_async(args.scene, args.style, args.mode, Path(args.outdir)))


if __name__ == "__main__":
    main()
