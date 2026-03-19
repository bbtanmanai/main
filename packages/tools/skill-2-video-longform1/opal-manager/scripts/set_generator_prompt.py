#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Opal A1 앱 제너레이터 프롬프트 자동 설정
==========================================
저장된 세션 쿠키로 Playwright 브라우저를 직접 실행 (CDP 불필요)
→ Opal 편집기 열기 → Generator 노드 Instructions 입력 → 자동 저장

사전 조건:
  - opal_login.bat 실행 완료 (session.json 저장 상태)
  - pip install playwright && playwright install chromium

사용법:
  python set_generator_prompt.py           # 기본 실행
  python set_generator_prompt.py --dry-run # 프롬프트 내용만 출력
  python set_generator_prompt.py --debug   # 각 단계 스크린샷
"""

from __future__ import annotations

import json
import sys
import argparse
from pathlib import Path

# ── 경로 설정 ─────────────────────────────────────────────────────────────────
_OPAL_ACCESS = Path(__file__).parent.parent.parent / "opal-access"
sys.path.insert(0, str(_OPAL_ACCESS))

APP_URL      = "https://opal.google/edit/1YQTJjGO0VnQN5U38CE6hHNIhbcindUXt"
SESSION_PATH = Path.home() / ".linkdrop-opal" / "profiles" / "default" / "session.json"
DEBUG_DIR    = Path("C:/tmp/opal_prompt_debug")

# ── Generator Instructions 프롬프트 ─────────────────────────────────────────
GENERATOR_PROMPT = """\
You are a professional motion graphic designer specializing in broadcast-quality cinematic background visuals for video production.

Your task: Generate a single, self-contained HTML page (1920×1080px) as a full-screen background visual for a video scene.

STRICT RULES:
1. ZERO TEXT — no letters, numbers, words, labels, captions, or symbols anywhere on screen
2. VISUAL ONLY — CSS gradients, SVG shapes, canvas animations, CSS keyframes
3. SELF-CONTAINED — no external URLs, no CDN, no img tags, no @import, no font-face
4. DIMENSIONS — html, body { margin:0; padding:0; overflow:hidden; width:1920px; height:1080px; }
5. BROADCAST QUALITY — rich, deep, vivid layered colors; subtle motion preferred
6. OUTPUT — return ONLY the complete HTML, opening the code block with ```html

The user will provide scene mood/theme and art style. Match the visual energy precisely."""


def print_prompt() -> None:
    print("\n" + "=" * 70)
    print("【Generator Instructions 프롬프트】")
    print("=" * 70)
    print(GENERATOR_PROMPT)
    print("=" * 70)
    print(f"\n총 {len(GENERATOR_PROMPT)}자")


def load_cookies() -> list[dict]:
    """session.json 에서 Playwright 쿠키 형식으로 변환.

    쿠키 prefix 규칙:
      __Host-xxx  → domain="" (호스트 전용, 도메인 속성 금지)
      __Secure-xx → domain=".google.com", secure=True
      일반         → domain=".google.com"

    브라우저 전용 아닌 토큰(OAuthRefreshToken, _ga* 등)은 제외.
    """
    if not SESSION_PATH.exists():
        raise FileNotFoundError(
            f"session.json 없음: {SESSION_PATH}\n  opal_login.bat을 먼저 실행하세요."
        )

    data = json.loads(SESSION_PATH.read_text(encoding="utf-8"))
    raw = data.get("cookies", {})

    if isinstance(raw, list):
        items = [(c["name"], c["value"]) for c in raw if "name" in c and "value" in c]
    else:
        items = list(raw.items())

    # 브라우저 쿠키가 아닌 항목 제외
    SKIP_NAMES = {"OAuthRefreshToken", "_ga", "_ga_XR9XVJ2F2Y"}

    pw_cookies: list[dict] = []
    for name, value in items:
        if name in SKIP_NAMES or name.startswith("_ga"):
            continue
        # Google 계열 도메인 모두 등록 (opal.google 인증에 accounts.google.com 쿠키 필요)
        for url in ["https://accounts.google.com", "https://opal.google",
                    "https://google.com"]:
            pw_cookies.append({
                "name": name,
                "value": str(value),
                "url": url,
                "httpOnly": False,
                "secure": True,
                "sameSite": "Lax",
            })

    return pw_cookies


def run_playwright(debug: bool = False) -> bool:
    try:
        from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
    except ImportError:
        print("[오류] Playwright 미설치")
        print("  pip install playwright && playwright install chromium")
        return False

    if debug:
        DEBUG_DIR.mkdir(parents=True, exist_ok=True)

    def screenshot(page, name: str) -> None:
        if debug:
            p = DEBUG_DIR / f"{name}.png"
            page.screenshot(path=str(p))
            print(f"  [DEBUG] 스크린샷: {p}")

    # ── 쿠키 로드 ──────────────────────────────────────────────────────────
    try:
        cookies = load_cookies()
        print(f"[1] 세션 쿠키 로드 완료 ({len(cookies) // 3}개)")
    except FileNotFoundError as e:
        print(f"[오류] {e}")
        return False

    # Chrome 프로필 경로 (opal_login.bat 이 사용하는 경로와 동일)
    CHROME_PROFILE = Path.home() / ".linkdrop-opal" / "chrome-profile"

    print(f"[2] Chrome 프로필 경로: {CHROME_PROFILE}")
    print(f"[2] Playwright 브라우저 실행 중 (기존 로그인 프로필 사용)...")
    with sync_playwright() as pw:
        # launch_persistent_context: 기존 Chrome 프로필 그대로 사용 → Google 로그인 상태 유지
        ctx = pw.chromium.launch_persistent_context(
            user_data_dir=str(CHROME_PROFILE),
            headless=False,
            viewport={"width": 1440, "height": 900},
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = ctx.new_page()

        # ── Opal 편집기 열기 ────────────────────────────────────────────────
        print(f"[3] Opal 편집기 로딩: {APP_URL}")
        page.goto(APP_URL, wait_until="domcontentloaded", timeout=30_000)

        # 편집기 캔버스 로드 대기
        try:
            page.wait_for_selector(
                'div[class*="canvas"], div[class*="editor"], div[class*="board"], [role="main"]',
                timeout=15_000,
            )
        except PWTimeout:
            page.wait_for_timeout(4_000)

        page.wait_for_timeout(2_500)
        screenshot(page, "01_loaded")

        # ── "Sign in with Google" 버튼 자동 처리 ─────────────────────────────
        try:
            sign_in_btn = page.locator('text="Sign in with Google"').first
            if sign_in_btn.is_visible(timeout=3_000):
                print("[3-auth] Google 로그인 버튼 감지 → 자동 클릭...")
                sign_in_btn.click()
                # 로그인 완료 후 편집기 로드 대기 (최대 20초)
                try:
                    page.wait_for_url("**/edit/**", timeout=20_000)
                except PWTimeout:
                    pass
                page.wait_for_timeout(3_000)
                screenshot(page, "01b_after_signin")
                print("[3-auth] 로그인 완료")
        except Exception:
            pass  # 이미 로그인 상태면 버튼 없음

        print("[3] 편집기 로드 완료")

        # ── Generate 노드 찾기 (Opal 캔버스 — 파란색 Generate 카드) ────────────
        print("[4] Generate 노드 탐색 중...")

        # 스크린샷 분석: 노드 이름은 "Generate", 노드 카드 헤더 클릭
        GENERATOR_SELECTORS = [
            # Opal 실제 UI — 노드 헤더 텍스트 "Generate" (정확히 일치, Render HTML 제외)
            'div[class*="node"] >> text="Generate"',
            'div[class*="card"] >> text="Generate"',
            'div[class*="step"] >> text="Generate"',
            # aria 기반
            '[aria-label="Generate"]',
            # 아이콘 + 텍스트 조합 (별표 아이콘 옆 "Generate" 헤더)
            'span:text-is("Generate")',
            'h3:text-is("Generate")',
            'p:text-is("Generate")',
            # 폴백: 첫 번째 text="Generate" 요소 (Generate 노드가 더 앞에 있음)
            'text="Generate"',
        ]

        generator_el = None
        for sel in GENERATOR_SELECTORS:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=2_000):
                    generator_el = el
                    print(f"  선택자 매칭: {sel}")
                    break
            except Exception:
                continue

        if generator_el is None:
            screenshot(page, "02_no_generator")
            print("[오류] Generator 노드를 자동으로 찾지 못했습니다.")
            print("  — 브라우저 창에서 Generator 노드를 직접 클릭해주세요.")
            print("  — 30초 내로 클릭하면 이후 단계를 자동 진행합니다.")

            # 사용자가 직접 클릭 대기 (30초)
            # Instructions 필드가 나타날 때까지 폴링
            deadline = 30
            found = False
            for _ in range(deadline):
                page.wait_for_timeout(1_000)
                for isel in ['[aria-label*="instruction" i]', 'textarea:visible',
                             'div[contenteditable="true"]:visible']:
                    try:
                        if page.locator(isel).first.is_visible(timeout=500):
                            found = True
                            break
                    except Exception:
                        pass
                if found:
                    break

            if not found:
                print("[실패] Instructions 필드가 열리지 않았습니다.")
                ctx.close()
                return False
            print("[4] Instructions 필드 감지 완료 (수동 클릭)")
        else:
            generator_el.click()
            print("[4] Generator 노드 클릭 완료")
            page.wait_for_timeout(1_500)
            screenshot(page, "02_clicked")

        # ── Instructions 필드 탐색 + 입력 ────────────────────────────────────
        print("[5] Instructions 필드 탐색 중...")

        INSTRUCTION_SELECTORS = [
            '[aria-label="Instructions"]',
            '[aria-label*="instruction" i]',
            '[placeholder*="instruction" i]',
            '[placeholder*="Add instructions" i]',
            'textarea[data-field="instructions"]',
            'div[contenteditable="true"][aria-label*="instruction" i]',
            # Opal 특유 RTE 영역 (contenteditable)
            'div[contenteditable="true"]:visible',
            'textarea:visible',
        ]

        instructions_el = None
        for sel in INSTRUCTION_SELECTORS:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=2_000):
                    instructions_el = el
                    print(f"  선택자 매칭: {sel}")
                    break
            except Exception:
                continue

        if instructions_el is None:
            screenshot(page, "03_no_field")
            print("[오류] Instructions 필드를 찾지 못했습니다.")
            print("  — 브라우저 창에서 직접 붙여넣기 후 Ctrl+S 저장하세요.")
            print("  — 프롬프트는 위에 출력된 내용을 복사하세요.")
            # 브라우저를 닫지 않고 대기 (사용자가 수동 처리)
            input("  완료 후 Enter를 누르세요...")
            ctx.close()
            return True

        # 기존 내용 전체 선택 후 덮어쓰기
        instructions_el.click()
        page.keyboard.press("Control+a")
        page.wait_for_timeout(300)
        instructions_el.fill(GENERATOR_PROMPT)
        page.wait_for_timeout(500)
        screenshot(page, "03_filled")
        print("[5] 프롬프트 입력 완료")

        # ── 저장 ──────────────────────────────────────────────────────────────
        print("[6] 저장 중 (Ctrl+S)...")
        page.keyboard.press("Control+s")
        page.wait_for_timeout(2_500)
        screenshot(page, "04_saved")

        print("\n[완료] Generator Instructions 설정 성공!")
        print(f"  앱 URL: {APP_URL}")
        print(f"  프롬프트 길이: {len(GENERATOR_PROMPT)}자")
        ctx.close()
        return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Opal Generator 프롬프트 자동 설정")
    parser.add_argument("--dry-run", action="store_true", help="프롬프트 내용만 출력")
    parser.add_argument("--debug",   action="store_true", help="각 단계 스크린샷 저장")
    args = parser.parse_args()

    print_prompt()

    if args.dry_run:
        print("\n[dry-run] UI 조작을 건너뜁니다.")
        return

    success = run_playwright(debug=args.debug)
    if not success:
        print("\n【수동 설정 안내】")
        print(f"1. 브라우저에서 열기: {APP_URL}")
        print("2. Generator 노드 클릭")
        print("3. Instructions 필드에 위 프롬프트 전체 붙여넣기")
        print("4. Ctrl+S 저장")
        sys.exit(1)


if __name__ == "__main__":
    main()
