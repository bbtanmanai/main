#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Opal 병렬 HTML 생성 + Playwright PNG 변환
==========================================
씬 N개를 asyncio.Semaphore로 동시 제어하며 AppCatalyst API에 병렬 투입.

LinkDrop 핵심 원칙: AI 재해석 없음 — scene_prompt_builder 직접 주입

사용법:
    from opal_parallel import generate_keyframes_opal
    png_paths = asyncio.run(generate_keyframes_opal(
        scenes=[("씬1 텍스트", 0), ("씬2 텍스트", 1)],
        art_style_id="ghibli-real",
        auth_info={"token": "Bearer ...", "cookies": "...", "headers": {}},
        out_dir=Path("opal_test"),
        emotion_id="calm_warm",
        tone_id="peaceful",
        max_concurrent=5,   # 429 발생 시 줄일 것 — 실측으로 최적값 결정
    ))
"""

from __future__ import annotations

import asyncio
import json
import re
import threading
import tempfile
from pathlib import Path

ENDPOINT = "https://appcatalyst.pa.googleapis.com/v1beta1/generateWebpageStream?alt=sse"
KEYFRAME_W = 1920
KEYFRAME_H = 1080

# ── ④ PNG 품질 기준 ──────────────────────────────────────────────────────────
PNG_MIN_KB      = 100    # 이 미만이면 빈 화면 의심
WHITE_MAX_RATIO = 0.70   # 흰색(near-white) 픽셀이 이 비율 초과 시 실패
MAX_RETRIES     = 3      # 씬당 최대 재시도 횟수


# ── HTML 생성 (씬 1개) ────────────────────────────────────────────────────────

async def _generate_one_html(
    scene_text: str,
    art_style_id: str,
    auth_info: dict,
    emotion_id: str | None,
    tone_id: str | None,
    semaphore: asyncio.Semaphore,
    scene_index: int,
    use_v2: bool = True,
) -> tuple[int, str | None]:
    """Semaphore 안에서 씬 1개의 HTML을 생성하고 (index, html) 반환."""
    import httpx
    import sys
    sys.path.insert(0, str(Path(__file__).parent))

    async with semaphore:
        token        = auth_info.get("token", "")
        cookies      = auth_info.get("cookies", "")
        raw_headers  = auth_info.get("headers", {})
        access_token = token.removeprefix("Bearer ").strip()

        if use_v2:
            # A1-A(GEMINI 씬분석) → A1-B(Opal HTML) 파이프라인
            from scene_prompt_builder import build_opal_prompt_v2
            system_instruction, user_content = await build_opal_prompt_v2(
                scene_text, art_style_id, emotion_id, tone_id
            )
        else:
            from scene_prompt_builder import build_opal_prompt
            system_instruction, user_content = build_opal_prompt(
                scene_text, art_style_id, emotion_id, tone_id
            )

        headers = {
            "Authorization": token,
            "Content-Type":  "application/json",
            "Referer":       "https://opal.google/",
            "Origin":        "https://opal.google",
            "User-Agent":    raw_headers.get("user-agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"),
        }
        for h in ["x-browser-channel", "x-browser-copyright",
                  "x-browser-validation", "x-browser-year", "x-client-data"]:
            if h in raw_headers:
                headers[h] = raw_headers[h]
        if cookies:
            headers["Cookie"] = cookies

        body = {
            "intent":          "",
            "modelName":       "gemini-2.5-pro",
            "userInstruction": system_instruction,
            "contents": [{
                "role": "user",
                "parts": [{
                    "text": user_content,
                    "partMetadata": {"input_name": "text_1"},
                }],
            }],
            "accessToken": access_token,
        }

        print(f"  [병렬] 씬{scene_index + 1} 생성 중...", end="", flush=True)
        full_text: list[str] = []

        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                resp = await client.post(ENDPOINT, json=body, headers=headers)
                if resp.status_code == 429:
                    print(f"\n  [병렬] 씬{scene_index + 1} → 429 Too Many Requests (max_concurrent 줄이기 권장)")
                    return scene_index, None
                if resp.status_code != 200:
                    print(f"\n  [병렬] 씬{scene_index + 1} → {resp.status_code}")
                    return scene_index, None
                for line in resp.text.splitlines():
                    if not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        for part in data.get("parts", []):
                            if part.get("partMetadata", {}).get("chunk_type") == "thought":
                                continue
                            t = part.get("text", "")
                            if t:
                                full_text.append(t)
                                print(".", end="", flush=True)
                    except Exception:
                        pass
            print(f" ({len(''.join(full_text)):,}자)")
        except Exception as e:
            print(f"\n  [병렬] 씬{scene_index + 1} 오류: {e}")
            return scene_index, None

        raw = "".join(full_text)
        m = re.search(r"```html\s*([\s\S]*?)```", raw)
        if m:
            return scene_index, m.group(1).strip()
        if "<html" in raw.lower() or "<!doctype" in raw.lower():
            return scene_index, raw.strip()
        return scene_index, raw.strip() if raw.strip() else None


# ── 병렬 HTML 생성 (전체 씬) ──────────────────────────────────────────────────

async def generate_htmls_parallel(
    scenes: list[tuple[str, int]],     # [(scene_text, index), ...]
    art_style_id: str,
    auth_info: dict,
    emotion_id: str | None = None,
    tone_id: str | None = None,
    max_concurrent: int = 5,
    use_v2: bool = True,
) -> dict[int, str | None]:
    """
    씬 목록을 asyncio.Semaphore로 제어하며 병렬 HTML 생성.

    max_concurrent 권장 값:
        전체 동시 → 429 발생 확인 후 아래로 내림
        10 → 공격적 병렬
         5 → 기본값 (보수적)
         3 → 안전 모드

    Returns:
        {scene_index: html_str or None}
    """
    semaphore = asyncio.Semaphore(max_concurrent)
    tasks = [
        _generate_one_html(
            scene_text, art_style_id, auth_info,
            emotion_id, tone_id, semaphore, idx, use_v2
        )
        for scene_text, idx in scenes
    ]
    results = await asyncio.gather(*tasks)
    return {idx: html for idx, html in results}


# ── ④ PNG 품질 검증 ──────────────────────────────────────────────────────────

def check_png_quality(png_path: Path) -> tuple[bool, str]:
    """
    PNG 품질 검증. 두 가지 기준 적용:
      1. 파일 크기 < PNG_MIN_KB  → 빈 화면 의심
      2. near-white 픽셀 비율 > WHITE_MAX_RATIO → 흰 배경만 렌더된 실패작

    Returns:
        (is_ok: bool, reason: str)
    """
    # 1. 파일 크기
    size_kb = png_path.stat().st_size // 1024
    if size_kb < PNG_MIN_KB:
        return False, f"파일 크기 부족 ({size_kb}KB < {PNG_MIN_KB}KB)"

    # 2. 흰색 지배 픽셀 검사
    try:
        from PIL import Image
        img = Image.open(png_path).convert("RGB")
        # 성능: 1/4 해상도로 다운샘플 후 검사
        small = img.resize((img.width // 4, img.height // 4))
        pixels = list(small.getdata())
        total  = len(pixels)
        # near-white: R>230, G>230, B>230
        white_count = sum(1 for r, g, b in pixels if r > 230 and g > 230 and b > 230)
        ratio = white_count / total
        if ratio > WHITE_MAX_RATIO:
            return False, f"흰 배경 지배 ({ratio:.0%} > {WHITE_MAX_RATIO:.0%})"
    except Exception as e:
        # Pillow 미설치 등 → 크기 검사만으로 통과
        print(f"  [품질] 픽셀 검사 건너뜀: {e}")

    return True, "OK"


# ── Playwright PNG 렌더링 (순차 — 메모리 안전) ─────────────────────────────────

def render_htmls_to_pngs(
    html_map: dict[int, str],
    out_dir: Path,
    wait_ms: int = 2000,
) -> dict[int, Path]:
    """
    HTML 문자열 딕셔너리 → PNG 파일 딕셔너리.
    Playwright는 동시 실행 시 메모리 폭발 위험 → 순차 처리.
    HTML은 임시 파일 사용 → PNG 생성 후 자동 삭제.
    """
    result: dict[int, Path] = {}

    def _run():
        from playwright.sync_api import sync_playwright
        out_dir.mkdir(parents=True, exist_ok=True)

        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={"width": KEYFRAME_W, "height": KEYFRAME_H})

            for idx in sorted(html_map.keys()):
                html = html_map[idx]
                if not html:
                    print(f"  [렌더] 씬{idx + 1} HTML 없음 → 건너뜀")
                    continue

                with tempfile.NamedTemporaryFile(
                    suffix=".html", delete=False, mode="w", encoding="utf-8"
                ) as f:
                    f.write(html)
                    tmp = Path(f.name)

                try:
                    page.goto(tmp.as_uri())
                    page.wait_for_timeout(wait_ms)
                    # 텍스트 강제 제거 (Opal이 타이틀/설명 삽입하는 패턴 방어)
                    page.evaluate("""() => {
                        document.querySelectorAll('text, tspan').forEach(el => el.remove());
                        const w = document.createTreeWalker(
                            document.body, NodeFilter.SHOW_TEXT, null);
                        const ns = [];
                        while (w.nextNode()) ns.push(w.currentNode);
                        ns.forEach(n => { n.textContent = ''; });
                    }""")
                    png_path = out_dir / f"keyframe_{idx:02d}.png"
                    page.screenshot(path=str(png_path), full_page=False)
                    result[idx] = png_path
                    size_kb = png_path.stat().st_size // 1024
                    print(f"  [렌더] 씬{idx + 1} → keyframe_{idx:02d}.png ({size_kb}KB)")
                except Exception as e:
                    print(f"  [렌더] 씬{idx + 1} 오류: {e}")
                finally:
                    tmp.unlink(missing_ok=True)

            browser.close()

    t = threading.Thread(target=_run)
    t.start()
    t.join()
    return result


# ── 공개 API: 씬 목록 → PNG 경로 목록 ───────────────────────────────────────

async def generate_keyframes_opal(
    scenes: list[tuple[str, int]],
    art_style_id: str,
    auth_info: dict,
    out_dir: Path,
    emotion_id: str | None = None,
    tone_id: str | None = None,
    max_concurrent: int = 5,
    png_wait_ms: int = 2000,
    max_retries: int = MAX_RETRIES,
    use_v2: bool = True,
) -> list[Path]:
    """
    씬 목록 → PNG 파일 경로 목록.
    병렬 HTML 생성 → 순차 PNG 렌더 → ④ 품질 검증 → 실패 씬 재시도.

    Args:
        scenes:         [(scene_text, index), ...] 형식
        art_style_id:   "ghibli-real" 등 화풍 ID
        auth_info:      {"token": "Bearer ...", "cookies": "...", "headers": {}}
        out_dir:        PNG 저장 디렉터리
        emotion_id:     감정 ID (선택 — None 시 키워드 매칭 폴백)
        tone_id:        톤앤매너 ID (선택)
        max_concurrent: 동시 API 요청 수 (429 발생 시 줄임)
        png_wait_ms:    PNG 렌더 전 대기 시간 (ms)
        max_retries:    씬당 최대 재시도 횟수 (기본 3)

    Returns:
        인덱스 순서로 정렬된 PNG Path 목록
    """
    n = len(scenes)
    scene_map = {idx: text for text, idx in scenes}
    png_map: dict[int, Path] = {}

    # ── 재시도 루프 ────────────────────────────────────────────────────────
    pending_scenes = list(scenes)  # 아직 성공하지 못한 씬 목록

    for attempt in range(1, max_retries + 1):
        if not pending_scenes:
            break

        label = f"시도 {attempt}/{max_retries}" if attempt > 1 else "1차 생성"
        print(f"\n[병렬] {len(pending_scenes)}개 씬 HTML 생성 ({label}, max_concurrent={max_concurrent})")

        html_map = await generate_htmls_parallel(
            pending_scenes, art_style_id, auth_info,
            emotion_id, tone_id, max_concurrent, use_v2,
        )

        success = sum(1 for v in html_map.values() if v)
        print(f"[병렬] HTML 완료: {success}/{len(pending_scenes)}개")

        if not success:
            print(f"[병렬] {label} 전체 실패")
            continue

        # ── PNG 렌더 ──────────────────────────────────────────────────────
        print(f"[렌더] Playwright PNG 변환 (순차)...")
        new_pngs = render_htmls_to_pngs(html_map, out_dir, png_wait_ms)

        # ── ④ 품질 검증 ───────────────────────────────────────────────────
        failed_this_round: list[tuple[str, int]] = []
        for idx, png_path in new_pngs.items():
            ok, reason = check_png_quality(png_path)
            if ok:
                png_map[idx] = png_path
                print(f"  [품질] 씬{idx + 1} ✓ OK")
            else:
                print(f"  [품질] 씬{idx + 1} ✗ {reason} → {'재시도' if attempt < max_retries else '포기'}")
                # 실패한 PNG 삭제
                png_path.unlink(missing_ok=True)
                if attempt < max_retries:
                    failed_this_round.append((scene_map[idx], idx))

        # HTML 생성은 됐지만 PNG 렌더 자체가 실패한 씬
        for idx in html_map:
            if idx not in new_pngs and idx not in png_map:
                if attempt < max_retries:
                    failed_this_round.append((scene_map[idx], idx))

        pending_scenes = failed_this_round

    # ── 최종 결과 ──────────────────────────────────────────────────────────
    final_ok   = len(png_map)
    final_fail = n - final_ok
    print(f"\n[품질] 최종: {final_ok}/{n}개 성공" + (f", {final_fail}개 실패" if final_fail else " ✓ 전체 통과"))

    return [png_map[i] for i in sorted(png_map.keys())]
