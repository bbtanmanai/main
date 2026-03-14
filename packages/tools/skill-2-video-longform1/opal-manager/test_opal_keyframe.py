#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Opal 나노바나나 제너레이터 방식 키프레임 단독 테스트
-----------------------------------------------------
씬1 텍스트를 contents 배열에 주입하여 generateWebpageStream API 호출.
SSE 원문(debug=True)으로 응답 구조 확인 후 HTML → PNG 저장.

사용법:
  python test_opal_keyframe.py
  python test_opal_keyframe.py --scene "혈압을 낮추는 5가지 식품" --style "ghibli-real"
"""

import sys
import os
import asyncio
import argparse
from pathlib import Path

# ── 경로 설정 ──────────────────────────────────────────────────────────────
_OPAL_MGR = Path(__file__).parent
_OPAL_API  = Path("C:/LinkDropV2/apps/api/services")
_OPAL_AUTH = Path(__file__).parent.parent / "opal-access"

for p in [str(_OPAL_MGR), str(_OPAL_API), str(_OPAL_AUTH)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# .env 로드
for _env in [
    _OPAL_MGR / ".env",
    _OPAL_MGR.parent.parent.parent.parent / ".env",
    _OPAL_MGR.parent.parent.parent.parent.parent / ".env",
]:
    if _env.exists():
        for line in _env.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
        break


async def test(scene_text: str, art_style: str, out_dir: Path) -> None:
    from opal_client import opal_client

    intent = ""  # 브라우저 실제 요청: intent는 빈 문자열
    scene_input = (
        f"Create a single self-contained HTML page that fills exactly 1920×1080px "
        f"with a full-screen cinematic BACKGROUND VISUAL only. "
        f"Art style: {art_style}. "
        f"Theme/mood: {scene_text}. "
        f"STRICT RULES: "
        f"1. NO text, NO labels, NO titles, NO captions anywhere — zero visible characters. "
        f"2. Use ONLY CSS gradients, SVG shapes, or canvas animations — NO img tags. "
        f"3. No external CDN, no external URLs, fully self-contained. "
        f"4. body/html: width:1920px; height:1080px; margin:0; overflow:hidden. "
        f"5. Deep, rich, broadcast-quality colors. "
        f"Output ONLY the complete HTML document starting with <!DOCTYPE html>."
    )

    print(f"[테스트] scene_input 길이: {len(scene_input)}")
    print("[테스트] API 호출 중 (debug=True, stderr 로 SSE 원문 출력)...")

    html = await opal_client.generate_html_slide(
        intent=intent,
        scene_text=scene_input,
        debug=True,
    )
    # thinking 블록만 남았으면 HTML 없음
    if html and not ("<html" in html.lower() or "<!doctype" in html.lower()):
        print(f"[경고] HTML 태그 없음, 응답 앞 200자: {html[:200]}")
        html = ""

    print(f"\n[결과] HTML 길이: {len(html)} 글자")
    if not html:
        print("[오류] HTML 빈 문자열 — API 응답 없음")
        return

    # HTML 저장
    out_dir.mkdir(parents=True, exist_ok=True)
    html_path = out_dir / "test_slide.html"
    html_path.write_text(html, encoding="utf-8")
    print(f"[저장] HTML: {html_path}")
    print(f"[미리보기] HTML 앞 300자:\n{html[:300]}")

    # Playwright PNG 변환 (별도 스레드 — asyncio 루프 충돌 방지)
    import threading

    def _screenshot():
        try:
            from playwright.sync_api import sync_playwright
            png_path = out_dir / "test_keyframe.png"
            with sync_playwright() as pw:
                browser = pw.chromium.launch()
                page = browser.new_page(viewport={"width": 1920, "height": 1080})
                page.goto(html_path.as_uri())
                page.wait_for_timeout(1500)
                page.screenshot(path=str(png_path), full_page=False)
                browser.close()
            print(f"[저장] PNG: {png_path} ({png_path.stat().st_size // 1024}KB)")
            print("[완료] 파일 탐색기에서 PNG를 열어 이미지를 확인하세요.")
        except ImportError:
            print("[알림] playwright 미설치: pip install playwright && playwright install chromium")
        except Exception as e:
            print(f"[오류] Playwright 스크린샷 실패: {e}")
            print("       C:/tmp/opal_test/test_slide.html 을 브라우저에서 열어 확인하세요.")

    t = threading.Thread(target=_screenshot)
    t.start()
    t.join(timeout=30)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scene",  default="하루 한 컵으로 혈압이 낮아진다? 시니어가 꼭 먹어야 할 식품 TOP5")
    parser.add_argument("--style",  default="ghibli-real")
    parser.add_argument("--outdir", default="C:/tmp/opal_test")
    args = parser.parse_args()

    asyncio.run(test(args.scene, args.style, Path(args.outdir)))


if __name__ == "__main__":
    main()
