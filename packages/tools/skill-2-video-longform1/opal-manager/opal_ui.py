#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Opal UI 자동화 — 씬 텍스트 → AI 이미지 PNG
=============================================
Playwright로 Opal 앱 App URL에 직접 진입.
Start → 스텝별 텍스트 입력 → 생성 완료 → 캡처

사용:
    from opal_ui import generate_image_opal_ui
    ok = generate_image_opal_ui(
        inputs=["황혼의 항구", "잔잔하고 따뜻함", "지브리 실사풍"],
        out_path=Path("keyframe.png")
    )
"""

from __future__ import annotations
import time, threading
from pathlib import Path

# Edit URL로 진입 → 우측 Preview 패널에서 작업
OPAL_APP_URL   = "https://opal.google/edit/1G4Ko1XNmeQPX4lIf8g31FmqVIl-rf4yq"
CHROME_PROFILE = Path.home() / ".linkdrop-opal" / "chrome-profile"
INPUT_SEL      = 'textarea[placeholder="Type or upload your response."]'
GENERATE_TIMEOUT = 300


def _app_frame(page):
    """매번 fresh하게 _app 프레임 반환."""
    frames = [page] + list(page.frames)
    return next((f for f in frames if "_app" in f.url), frames[-1])


def generate_image_opal_ui(
    inputs: list[str],
    out_path: Path,
    headless: bool = False,
    timeout: int = GENERATE_TIMEOUT,
) -> bool:
    result = {"ok": False}

    def _run():
        from playwright.sync_api import sync_playwright

        with sync_playwright() as pw:
            ctx = pw.chromium.launch_persistent_context(
                user_data_dir=str(CHROME_PROFILE),
                headless=headless,
                viewport={"width": 1440, "height": 900},
                args=["--disable-blink-features=AutomationControlled"],
            )
            page = ctx.new_page()

            # ── App URL 직접 진입 ─────────────────────────────────────
            print(f"[Opal UI] App URL 진입...")
            page.goto(OPAL_APP_URL, wait_until="domcontentloaded", timeout=30_000)
            page.wait_for_timeout(4_000)

            frame = _app_frame(page)

            # ── Start 버튼 클릭 ───────────────────────────────────────
            print("[Opal UI] Start 버튼 대기...")
            for _ in range(20):
                frame = _app_frame(page)
                try:
                    btn = frame.locator("button#run").first
                    if btn.is_visible(timeout=500):
                        btn.click()
                        print("[Opal UI] ✓ Start 클릭")
                        page.wait_for_timeout(2_500)
                        break
                except Exception:
                    pass
                page.wait_for_timeout(500)

            # ── 스텝별 입력 ──────────────────────────────────────────
            for step_idx, text in enumerate(inputs):
                print(f"[Opal UI] 스텝 {step_idx+1}/{len(inputs)}: {text[:50]}")

                # textarea 대기 (최대 20초)
                ta = None
                for _ in range(40):
                    frame = _app_frame(page)
                    try:
                        el = frame.locator(INPUT_SEL).first
                        if el.is_visible(timeout=300):
                            ta = el
                            break
                    except Exception:
                        pass
                    page.wait_for_timeout(500)

                if ta is None:
                    print(f"  [오류] textarea 없음 — 건너뜀")
                    continue

                # 입력
                ta.click()
                ta.fill(text)
                page.wait_for_timeout(800)

                # 제출: ► 버튼 클릭 (여러 방법 시도)
                submitted = False
                frame = _app_frame(page)

                # 방법 1: aria-label로 찾기
                for aria in ["Send", "Submit", "send", "submit", "전송", "제출"]:
                    try:
                        btn = frame.locator(f'button[aria-label="{aria}"]').first
                        if btn.is_visible(timeout=300):
                            btn.click()
                            submitted = True
                            print(f"  → ✓ 제출 (aria={aria})")
                            break
                    except Exception:
                        pass

                # 방법 2: textarea 다음 형제 또는 부모의 마지막 버튼
                if not submitted:
                    try:
                        clicked = frame.evaluate("""() => {
                            const ta = document.querySelector(
                                'textarea[placeholder="Type or upload your response."]');
                            if (!ta) return 'no_textarea';
                            // 부모 5단계까지 올라가며 버튼 탐색
                            let el = ta.parentElement;
                            for (let i = 0; i < 6; i++) {
                                if (!el) break;
                                const btns = [...el.querySelectorAll('button')];
                                const send = btns.find(b =>
                                    b !== ta &&
                                    (b.type === 'submit' ||
                                     b.getAttribute('aria-label')?.toLowerCase().includes('send') ||
                                     b.className?.includes('send') ||
                                     b.className?.includes('submit') ||
                                     b.innerHTML?.includes('send') ||
                                     b.innerHTML?.includes('arrow') ||
                                     b.innerHTML?.includes('play_arrow'))
                                );
                                if (send) { send.click(); return 'clicked:' + send.className; }
                                el = el.parentElement;
                            }
                            // 최후: 가장 가까운 버튼 클릭
                            let el2 = ta.parentElement;
                            for (let i = 0; i < 4; i++) {
                                if (!el2) break;
                                const btns = [...el2.querySelectorAll('button')];
                                if (btns.length > 0) {
                                    btns[btns.length - 1].click();
                                    return 'fallback:' + btns[btns.length - 1].className;
                                }
                                el2 = el2.parentElement;
                            }
                            return 'no_button';
                        }""")
                        if clicked and not clicked.startswith("no"):
                            submitted = True
                            print(f"  → ✓ 제출 ({clicked[:40]})")
                    except Exception as e:
                        pass

                # 방법 3: Ctrl+Enter (많은 채팅 UI에서 제출)
                if not submitted:
                    frame = _app_frame(page)
                    frame.locator(INPUT_SEL).first.press("Control+Enter")
                    print(f"  → Ctrl+Enter")
                    submitted = True

                page.wait_for_timeout(2_000)

            # ── 생성 완료 대기 (폴링) ─────────────────────────────────
            print(f"[Opal UI] 생성 대기 (최대 {timeout}초)...")
            elapsed = 0
            while elapsed < timeout:
                page.wait_for_timeout(5_000)
                elapsed += 5
                frame = _app_frame(page)
                # JS로 shadow DOM 포함 전체 텍스트 추출
                try:
                    all_text = frame.evaluate("""() => {
                        function getText(el) {
                            let t = '';
                            if (el.shadowRoot) t += getText(el.shadowRoot);
                            for (const c of el.childNodes) {
                                if (c.nodeType === 3) t += c.textContent;
                                else if (c.nodeType === 1) t += getText(c);
                            }
                            return t;
                        }
                        return getText(document.body);
                    }""")
                    import re
                    pct = re.search(r'(\d+)%', all_text)
                    is_thinking = "Thinking" in all_text
                    if pct:
                        print(f"  {pct.group()} ", end="", flush=True)
                    else:
                        print(".", end="", flush=True)

                    if not is_thinking and elapsed >= 15:
                        print(f"\n[Opal UI] ✓ 생성 완료")
                        page.wait_for_timeout(3_000)
                        break
                except Exception:
                    print(".", end="", flush=True)
            print()

            # 추가 로드 대기
            page.wait_for_timeout(3_000)

            # ── 캡처: Preview 패널의 생성 이미지 ────────────────────
            out_path.parent.mkdir(parents=True, exist_ok=True)
            frame = _app_frame(page)
            captured = False

            # 생성된 이미지 URL 추출 (blob / storage / opal CDN)
            for sel in ['img[src*="storage"]', 'img[src*="opal.google"]',
                        'img[src*="blob"]']:
                try:
                    els = frame.locator(sel).all()
                    visible = [el for el in els if el.is_visible(timeout=200)]
                    if not visible:
                        continue
                    # 가장 큰 이미지 선택
                    best = max(visible, key=lambda el: el.bounding_box().get("width", 0))
                    best.screenshot(path=str(out_path))
                    kb = out_path.stat().st_size // 1024
                    print(f"[Opal UI] ✓ 이미지 캡처 → {out_path.name} ({kb}KB)")
                    captured = True
                    break
                except Exception:
                    pass

            if not captured:
                # 폴백: 전체 스크린샷
                page.screenshot(path=str(out_path))
                kb = out_path.stat().st_size // 1024
                print(f"[Opal UI] 전체 스크린샷 → {out_path.name} ({kb}KB)")
                captured = True

            result["ok"] = captured
            ctx.close()

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    t.join(timeout=timeout + 60)
    return result["ok"]


# ── CLI ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic",  default="황혼의 항구, 붉은 노을, 파도 소리")
    parser.add_argument("--effect", default="잔잔하고 따뜻함")
    parser.add_argument("--style",  default="지브리 실사풍")
    parser.add_argument("--out",    default=r"C:\LinkDropV2\opal_test\keyframe_ui.png")
    args = parser.parse_args()

    ok = generate_image_opal_ui(
        inputs=[args.topic, args.effect, args.style],
        out_path=Path(args.out),
    )
    print(f"\n결과: {'✓ 성공' if ok else '✗ 실패'}")
