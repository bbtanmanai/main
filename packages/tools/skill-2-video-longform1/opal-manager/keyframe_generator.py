"""
키프레임 생성기
==============
NotebookLM slide_deck → PDF → PNG (우선)
Pillow 그라데이션 슬라이드 (폴백)

사용법:
    from keyframe_generator import generate_keyframes
    png_paths = generate_keyframes(job, work_dir)  # list[Path]
"""

from __future__ import annotations

import asyncio
import sys
import time
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from logic import PipelineJob

# ── 출력 크기 ────────────────────────────────────────────────────────────────
KEYFRAME_W = 1920
KEYFRAME_H = 1080

# ── 화풍별 색상 팔레트 (Pillow 폴백용) ─────────────────────────────────────
ART_PALETTES: dict[str, dict] = {
    "hollywood-sf": {
        "bg_top": (5, 10, 30),       "bg_bot": (20, 0, 60),
        "accent": (0, 200, 255),     "text": (180, 220, 255),
    },
    "anime-sf": {
        "bg_top": (200, 220, 255),   "bg_bot": (255, 200, 230),
        "accent": (100, 60, 200),    "text": (50, 30, 100),
    },
    "ink-wash": {
        "bg_top": (245, 240, 230),   "bg_bot": (220, 210, 195),
        "accent": (40, 30, 20),      "text": (30, 25, 15),
    },
    "pixar-3d": {
        "bg_top": (255, 200, 100),   "bg_bot": (255, 150, 50),
        "accent": (255, 80, 20),     "text": (255, 255, 240),
    },
    "neo-noir": {
        "bg_top": (10, 10, 10),      "bg_bot": (30, 5, 5),
        "accent": (200, 30, 30),     "text": (220, 220, 220),
    },
    "pop-art": {
        "bg_top": (255, 240, 0),     "bg_bot": (255, 100, 0),
        "accent": (220, 0, 100),     "text": (20, 10, 80),
    },
    "reality": {
        "bg_top": (200, 185, 165),   "bg_bot": (170, 150, 130),
        "accent": (80, 60, 40),      "text": (30, 20, 10),
    },
    "ghibli-real": {
        "bg_top": (180, 230, 190),   "bg_bot": (150, 200, 240),
        "accent": (60, 130, 80),     "text": (30, 60, 50),
    },
    "sticker-cutout": {
        "bg_top": (255, 255, 255),   "bg_bot": (240, 240, 255),
        "accent": (100, 80, 255),    "text": (40, 30, 120),
    },
    # 기본값
    "_default": {
        "bg_top": (20, 30, 60),      "bg_bot": (10, 10, 30),
        "accent": (100, 150, 255),   "text": (220, 230, 255),
    },
}

NLM_POLL_INTERVAL  = 10   # 초: 아티팩트 완료 대기 폴링 간격

# ── 화풍별 Opal 프롬프트 (art_styles.json) ────────────────────────────────────
_ART_STYLES_JSON = Path(__file__).parent / "art_styles.json"

def _load_art_style_prompt(style_id: str) -> str:
    """art_styles.json 에서 화풍 프롬프트를 로드합니다."""
    try:
        import json as _json
        data = _json.loads(_ART_STYLES_JSON.read_text(encoding="utf-8"))
        entry = data.get(style_id) or data.get("_default", {})
        return entry.get("prompt", "")
    except Exception as e:
        print(f"[화풍] art_styles.json 로드 실패: {e}")
        return ""
NLM_MAX_WAIT       = 180  # 초: 최대 대기 시간 (3분)
NLM_CREATE_TIMEOUT = 30   # 초: create_artifact 최대 대기 (네트워크 타임아웃)


# ── Pillow 폴백: 그라데이션 키프레임 ─────────────────────────────────────────

def _make_gradient_keyframe(
    scene_index: int,
    scene_count: int,
    art_style: str,
    work_dir: Path,
) -> Path:
    """Pillow로 단순 그라데이션 배경 PNG를 생성합니다."""
    from PIL import Image, ImageDraw

    palette = ART_PALETTES.get(art_style, ART_PALETTES["_default"])
    img = Image.new("RGB", (KEYFRAME_W, KEYFRAME_H))
    draw = ImageDraw.Draw(img)

    top = palette["bg_top"]
    bot = palette["bg_bot"]
    acc = palette["accent"]

    # 수직 그라데이션
    for y in range(KEYFRAME_H):
        r = int(top[0] + (bot[0] - top[0]) * y / KEYFRAME_H)
        g = int(top[1] + (bot[1] - top[1]) * y / KEYFRAME_H)
        b = int(top[2] + (bot[2] - top[2]) * y / KEYFRAME_H)
        draw.line([(0, y), (KEYFRAME_W, y)], fill=(r, g, b))

    # 악센트 라인 (하단)
    draw.rectangle([(0, KEYFRAME_H - 8), (KEYFRAME_W, KEYFRAME_H)], fill=acc)

    # 씬 번호 인디케이터 (우하단, 작게)
    try:
        from PIL import ImageFont
        font = ImageFont.truetype("arial.ttf", 28)
    except Exception:
        font = None

    label = f"{scene_index + 1} / {scene_count}"
    text_color = palette["text"]
    if font:
        draw.text((KEYFRAME_W - 120, KEYFRAME_H - 55), label, fill=text_color, font=font)
    else:
        draw.text((KEYFRAME_W - 80, KEYFRAME_H - 45), label, fill=text_color)

    # 중앙 장식 원
    cx, cy = KEYFRAME_W // 2, KEYFRAME_H // 2
    r_size = min(KEYFRAME_W, KEYFRAME_H) // 6
    for ring in range(3):
        draw.ellipse(
            [cx - r_size + ring * 20, cy - r_size + ring * 20,
             cx + r_size - ring * 20, cy + r_size - ring * 20],
            outline=(*acc[:3], max(255 - ring * 80, 0)),
            width=2 - (ring > 1),
        )

    out = work_dir / f"keyframe_{scene_index:02d}.png"
    img.save(str(out), "PNG")
    return out


def _make_all_gradient_keyframes(
    clip_count: int,
    art_style: str,
    work_dir: Path,
) -> list[Path]:
    """모든 씬에 대해 Pillow 그라데이션 키프레임을 생성합니다."""
    return [
        _make_gradient_keyframe(i, clip_count, art_style, work_dir)
        for i in range(clip_count)
    ]


# ── NotebookLM slide_deck → PDF → PNG ────────────────────────────────────────

def _notebooklm_keyframes(
    job: "PipelineJob",
    work_dir: Path,
) -> list[Path] | None:
    """
    NotebookLM slide_deck 생성 → slide_deck_url 직접 다운로드 → PNG 변환.
    실패 시 None 반환.

    폴링 로직:
      - `get_studio_status` 반환 artifact에서 `slide_deck_url`이 채워지면 완료
      - `status == 'completed'` OR `slide_deck_url is not None` 중 하나라도 True면 진행
    """
    try:
        import httpx
        import concurrent.futures as _cf
        from notebooklm_tools import NotebookLMClient
        from notebooklm_tools.core.auth import load_cached_tokens
        from notebooklm_tools.services import studio as nlm_studio

        tokens = load_cached_tokens()
        if not tokens:
            print("[키프레임] NotebookLM 인증 없음 → Pillow 폴백")
            return None

        sys.path.insert(0, str(Path(__file__).parent))
        from logic import APP_NOTEBOOK_MAP, DEFAULT_NOTEBOOK_ID

        notebook_id = APP_NOTEBOOK_MAP.get(job.app_id, DEFAULT_NOTEBOOK_ID)
        client = NotebookLMClient(
            cookies=tokens.cookies,
            csrf_token=tokens.csrf_token,
            session_id=tokens.session_id,
        )

        # ── 슬라이드 생성 ────────────────────────────────────────────────────
        scene_texts = "\n".join(
            f"[씬{c.index + 1}] {c.scene_text}" for c in job.clips
        )
        art_note = job.art_prompt or (
            "각각의 슬라이드가 키프레임이 되도록 해주고 슬라이드에는 텍스트를 넣지 말아줘."
        )
        focus = (
            f"{art_note}\n\n"
            f"아래 시나리오의 각 씬에 맞는 슬라이드를 {len(job.clips)}개 생성하세요:\n"
            f"{scene_texts}"
        )

        print(f"[키프레임] NotebookLM 슬라이드 생성 중... ({len(job.clips)}개 씬)")

        # create_artifact 타임아웃 (network hang 방지)
        _pool = _cf.ThreadPoolExecutor(max_workers=1)
        _fut = _pool.submit(
            nlm_studio.create_artifact,
            client=client,
            notebook_id=notebook_id,
            artifact_type="slide_deck",
            custom_prompt=focus,
            slide_format="detailed_deck",
            language="ko",
        )
        try:
            result = _fut.result(timeout=NLM_CREATE_TIMEOUT)
        except _cf.TimeoutError:
            _pool.shutdown(wait=False)
            print(f"[키프레임] create_artifact 타임아웃 ({NLM_CREATE_TIMEOUT}s) → Pillow 폴백")
            return None
        finally:
            _pool.shutdown(wait=False)

        if not result or not result.get("artifact_id"):
            print("[키프레임] 아티팩트 생성 실패 → Pillow 폴백")
            return None

        artifact_id = result["artifact_id"]
        print(f"[키프레임] 아티팩트 ID: {artifact_id[:16]}... 완료 대기 중...")

        # ── 완료 폴링: slide_deck_url 또는 status=='completed' ─────────────
        slide_url: str | None = None
        elapsed = 0
        while elapsed < NLM_MAX_WAIT:
            time.sleep(NLM_POLL_INTERVAL)
            elapsed += NLM_POLL_INTERVAL
            try:
                status_result = nlm_studio.get_studio_status(client, notebook_id)
                target = next(
                    (a for a in status_result.get("artifacts", [])
                     if a.get("artifact_id") == artifact_id),
                    None,
                )
                if target:
                    st = target.get("status", "")
                    url = target.get("slide_deck_url") or ""
                    # slide_deck_url이 채워지거나 status가 completed면 완료
                    if url or st in ("completed", "ready", "done"):
                        slide_url = url or None
                        print(f"[키프레임] 슬라이드 완료! ({elapsed}초, url={'있음' if url else '없음'})")
                        break
                    elif st in ("failed", "error"):
                        print("[키프레임] 슬라이드 생성 실패 → Pillow 폴백")
                        return None
                    else:
                        print(f"[키프레임]   대기 중... {elapsed}초 경과 (status={st})")
                else:
                    print(f"[키프레임]   대기 중... {elapsed}초 경과 (아티팩트 미조회)")
            except Exception as e:
                print(f"[키프레임] 상태 조회 오류: {e}")
        else:
            print("[키프레임] 타임아웃 → Pillow 폴백")
            return None

        # ── slide_deck_url로 직접 PDF 다운로드 (download_async 불필요) ────
        pdf_path = work_dir / "slides.pdf"
        print("[키프레임] PDF 다운로드 중...")

        if slide_url:
            # 직접 URL 다운로드 (notebooklm 쿠키로 인증)
            raw_cookies = tokens.cookies or {}
            if isinstance(raw_cookies, list):
                # notebooklm_tools가 list[{name, value}] 형식으로 반환하는 경우
                cookie_header = "; ".join(
                    f"{c['name']}={c['value']}"
                    for c in raw_cookies
                    if "name" in c and "value" in c
                )
            else:
                cookie_header = "; ".join(f"{k}={v}" for k, v in raw_cookies.items())
            headers = {"Cookie": cookie_header} if cookie_header else {}
            with httpx.Client(timeout=60, follow_redirects=True) as hx:
                resp = hx.get(slide_url, headers=headers)
                resp.raise_for_status()
                pdf_path.write_bytes(resp.content)
        else:
            # URL이 없으면 download_async 사용
            from notebooklm_tools.services import downloads as nlm_downloads

            async def _dl() -> None:
                await nlm_downloads.download_async(
                    client=client,
                    notebook_id=notebook_id,
                    artifact_type="slide_deck",
                    output_path=str(pdf_path),
                    artifact_id=artifact_id,
                    slide_deck_format="pdf",
                )
            asyncio.run(_dl())

        if not pdf_path.exists() or pdf_path.stat().st_size < 1024:
            print("[키프레임] PDF 다운로드 실패 → Pillow 폴백")
            return None

        print(f"[키프레임] PDF 다운로드 완료 ({pdf_path.stat().st_size // 1024}KB)")
        return _pdf_to_pngs(pdf_path, len(job.clips), work_dir)

    except Exception as e:
        print(f"[키프레임] NotebookLM 오류: {e} → Pillow 폴백")
        return None


def _pdf_to_pngs(pdf_path: Path, target_count: int, work_dir: Path) -> list[Path]:
    """
    PDF 파일을 1920×1080 PNG 이미지 목록으로 변환.
    페이지 비율을 유지하며 letterbox(상하/좌우 여백)로 채움.
    페이지 수가 씬 수와 다를 경우 비례 매핑.
    """
    import fitz  # PyMuPDF
    from PIL import Image
    import io

    doc = fitz.open(str(pdf_path))
    page_count = len(doc)

    # PDF 페이지 수가 씬 수와 다른 경우 인덱스 매핑
    page_indices = [
        min(int(i * page_count / target_count), page_count - 1)
        for i in range(target_count)
    ]

    png_paths: list[Path] = []
    for scene_i, page_i in enumerate(page_indices):
        page = doc[page_i]

        # 고해상도 렌더 (2배 DPI)
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat, alpha=False)

        # PIL로 1920×1080 letterbox 변환
        slide_img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)

        # 비율 유지 스케일
        scale = min(KEYFRAME_W / slide_img.width, KEYFRAME_H / slide_img.height)
        new_w = int(slide_img.width * scale)
        new_h = int(slide_img.height * scale)
        slide_scaled = slide_img.resize((new_w, new_h), Image.LANCZOS)

        # 배경 캔버스 (어두운 슬레이트)
        canvas = Image.new("RGB", (KEYFRAME_W, KEYFRAME_H), (25, 30, 45))
        offset_x = (KEYFRAME_W - new_w) // 2
        offset_y = (KEYFRAME_H - new_h) // 2
        canvas.paste(slide_scaled, (offset_x, offset_y))

        out = work_dir / f"keyframe_{scene_i:02d}.png"
        canvas.save(str(out), "PNG")
        png_paths.append(out)

    doc.close()
    print(f"[키프레임] PDF {page_count}페이지 → {KEYFRAME_W}×{KEYFRAME_H} PNG {target_count}개 변환 완료")
    return png_paths


# ── Opal App Pool 병렬 HTML → Playwright PNG ─────────────────────────────────

def _opal_html_keyframes(
    job: "PipelineJob",
    work_dir: Path,
) -> list[Path] | None:
    """
    Opal App Pool 병렬 방식:
      1. 최대 30개 App 슬롯에 씬을 동시 투입 (generateWebpageStream)
      2. 전체 HTML 완료 대기 (Barrier)
      3. Playwright 일괄 스크린샷 → PNG

    실패 시 None 반환 → Pillow 폴백.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[키프레임] playwright 미설치 → pip install playwright && playwright install chromium")
        return None

    try:
        import asyncio
        from concurrent.futures import ThreadPoolExecutor, as_completed

        _API_SERVICES = Path("C:/LinkDropV2/apps/api/services")
        if str(_API_SERVICES) not in sys.path:
            sys.path.insert(0, str(_API_SERVICES))
        from opal_client import opal_client as _opal_client

        sys.path.insert(0, str(Path(__file__).parent))
        from opal_app_pool import get_pool

        pool = get_pool()
        n = len(job.clips)
        workers = min(n, pool.total_slots)

        print(f"[키프레임] Opal 병렬 생성: {n}개 씬 → {workers}개 동시 슬롯")

        # ── Phase 1: 전체 씬 병렬 HTML 생성 (Barrier) ────────────────────────
        html_map: dict[int, Path] = {}
        errors: list[int] = []

        def _gen_html(clip) -> tuple[int, Path | None]:
            app_id = pool.acquire()
            try:
                # 나노바나나 제너레이터 방식:
                #   intent  = 화풍/스타일 지시 (고수준 컨텍스트)
                #   scene_text = 씬 내용 → contents[user] 에 주입
                mood = clip.scene_text[:120] if clip.scene_text else "abstract cinematic scene"

                # art_styles.json 에서 화풍 프롬프트 로드
                style_id = _extract_art_style_id(job.art_prompt or "")
                style_prompt = _load_art_style_prompt(style_id)

                # contents[user] 에 주입할 씬별 프롬프트
                # = 화풍 전용 프롬프트 + 씬 내용(mood)
                if style_prompt:
                    scene_input = (
                        f"{style_prompt}\n\n"
                        f"Scene mood/theme to evoke: {mood}\n\n"
                        f"Generate a single self-contained HTML page (1920×1080px, "
                        f"body margin:0, overflow:hidden). "
                        f"NO text, NO labels, NO img tags — only CSS/SVG/Canvas visuals. "
                        f"No external CDN or URLs. Output only the complete HTML."
                    )
                else:
                    scene_input = (
                        f"Create a full-screen cinematic background visual (1920×1080px) "
                        f"that evokes the mood and theme of: {mood}\n"
                        f"NO text, NO labels. CSS/SVG only. Self-contained HTML."
                    )

                intent = ""  # 브라우저 실제 요청 구조: intent 는 빈 문자열
                # 첫 씬(인덱스 0)에서만 debug 출력으로 SSE 원문 확인
                is_first = clip.index == 0

                loop = asyncio.new_event_loop()
                try:
                    html = loop.run_until_complete(
                        _opal_client.generate_html_slide(
                            intent=intent,
                            scene_text=scene_input,
                            app_id=app_id,
                            debug=is_first,
                        )
                    )
                    # HTML 유효성 확인 (thinking 블록만 남은 경우 제거)
                    if html and not ("<html" in html.lower() or "<!doctype" in html.lower()):
                        print(f"  [키프레임] 씬{clip.index+1} 응답에 HTML 없음 (thinking만 반환)")
                        html = ""
                finally:
                    loop.close()

                if not html:
                    print(f"  [키프레임] 씬{clip.index + 1} 빈 응답")
                    return clip.index, None

                html_path = work_dir / f"slide_{clip.index:02d}.html"
                html_path.write_text(html, encoding="utf-8")
                print(f"  [키프레임] 씬{clip.index + 1}/{n} HTML 완료")
                return clip.index, html_path

            finally:
                pool.release(app_id)

        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {executor.submit(_gen_html, clip): clip.index for clip in job.clips}
            for future in as_completed(futures):
                idx, html_path = future.result()
                if html_path is None:
                    errors.append(idx)
                else:
                    html_map[idx] = html_path

        if errors:
            print(f"[키프레임] {len(errors)}개 씬 HTML 실패 (씬{[e+1 for e in errors]}) → Pillow 폴백")
            return None

        print(f"[키프레임] 전체 {n}개 HTML 완료. Playwright 스크린샷 시작...")

        # ── Phase 2: Playwright 일괄 스크린샷 ────────────────────────────────
        png_paths: list[Path] = []
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={"width": KEYFRAME_W, "height": KEYFRAME_H})
            for i in range(n):
                html_path = html_map[i]
                page.goto(html_path.as_uri())
                page.wait_for_timeout(500)
                out = work_dir / f"keyframe_{i:02d}.png"
                page.screenshot(path=str(out), full_page=False)
                png_paths.append(out)
                print(f"  [키프레임] 스크린샷: keyframe_{i:02d}.png")
            browser.close()

        return png_paths

    except Exception as e:
        print(f"[키프레임] Opal HTML 오류: {e} → Pillow 폴백")
        return None


# ── 공개 API ─────────────────────────────────────────────────────────────────

def generate_keyframes(
    job: "PipelineJob",
    work_dir: Path,
    use_notebooklm: bool = False,
    use_opal: bool = False,
    opal_max_concurrent: int = 5,
    emotion_id: str | None = None,
    tone_id: str | None = None,
    use_v2: bool = True,
    provider: str | None = None,
) -> list[Path]:
    """
    씬 수만큼 키프레임 PNG를 생성합니다.

    provider 파라미터 (신규, 명시적 교체용):
        provider="nlm"    → NotebookLM slide_deck (nlm_styles.json 화풍 프롬프트)
        provider="opal"   → Opal AppCatalyst HTML → Playwright PNG
        provider="pillow" → Pillow 그라데이션 (즉시)

    기존 플래그 (하위 호환):
        use_opal=True       → provider="opal" 와 동일
        use_notebooklm=True → provider="nlm" 와 동일
        둘 다 False         → provider="pillow" 와 동일

    Args:
        job:                  PipelineJob (clips, art_prompt, app_id 필드 필요)
        work_dir:             PNG 저장 디렉터리
        provider:             "nlm" | "opal" | "pillow" (None이면 use_* 플래그 사용)
        use_opal:             True 일 때 Opal 병렬 모드 시도 (기본 False)
        opal_max_concurrent:  동시 API 요청 수 (429 발생 시 줄임, 기본 5)
        emotion_id:           감정 ID — scene_prompt_builder 큐레이션 프리셋 선택
        tone_id:              톤앤매너 ID
        use_notebooklm:       True 일 때만 NLM 슬라이드 시도 (기본 False)

    Returns:
        씬 순서대로 정렬된 PNG Path 목록 (len == job.clip_count)
    """
    work_dir.mkdir(parents=True, exist_ok=True)

    # 기존 파일 재사용 (재시도 시)
    existing = sorted(work_dir.glob("keyframe_*.png"))
    if len(existing) == job.clip_count:
        print(f"[키프레임] 기존 파일 재사용: {len(existing)}개")
        return existing

    art_style = _extract_art_style_id(job.art_prompt or "")

    # ── provider 명시 시: Provider 패턴으로 위임 ──────────────────────────────
    if provider:
        return _dispatch_to_provider(
            provider, job, work_dir, art_style,
            opal_max_concurrent, emotion_id, tone_id, use_v2,
        )

    # ── 기존 플래그 방식 (하위 호환) ─────────────────────────────────────────
    if use_opal:
        result = _opal_parallel_keyframes(
            job, work_dir, art_style,
            emotion_id, tone_id, opal_max_concurrent, use_v2
        )
        if result and len(result) == job.clip_count:
            return result
        # 폴백: 기존 App Pool 방식 시도
        result = _opal_html_keyframes(job, work_dir)
        if result and len(result) == job.clip_count:
            return result

    if use_notebooklm:
        result = _notebooklm_keyframes(job, work_dir)
        if result and len(result) == job.clip_count:
            return result

    # Pillow 기본 (즉시)
    print(f"[키프레임] Pillow로 {job.clip_count}개 생성 중... (art: {art_style})")
    return _make_all_gradient_keyframes(job.clip_count, art_style, work_dir)


def _dispatch_to_provider(
    provider_name: str,
    job: "PipelineJob",
    work_dir: Path,
    art_style: str,
    opal_max_concurrent: int,
    emotion_id: str | None,
    tone_id: str | None,
    use_v2: bool,
) -> list[Path]:
    """Provider 패턴으로 키프레임 생성을 위임합니다."""
    sys.path.insert(0, str(Path(__file__).parent))
    from keyframe_providers import get_provider, SceneRequest
    from logic import APP_NOTEBOOK_MAP, DEFAULT_NOTEBOOK_ID

    scenes = [
        SceneRequest(
            index=c.index,
            scene_text=c.scene_text,
            art_style_id=art_style,
            art_prompt=job.art_prompt or None,
        )
        for c in job.clips
    ]

    kwargs: dict = {}
    if provider_name == "nlm":
        notebook_id = APP_NOTEBOOK_MAP.get(job.app_id, DEFAULT_NOTEBOOK_ID)
        kwargs["notebook_id"] = notebook_id
    elif provider_name == "opal":
        kwargs.update(
            max_concurrent=opal_max_concurrent,
            emotion_id=emotion_id,
            tone_id=tone_id,
            use_v2=use_v2,
        )

    print(f"[키프레임] Provider: {provider_name!r} | 스타일: {art_style} | 씬: {len(scenes)}개")
    prov = get_provider(provider_name, **kwargs)
    return prov.generate(scenes, work_dir)


def _opal_parallel_keyframes(
    job: "PipelineJob",
    work_dir: Path,
    art_style: str,
    emotion_id: str | None,
    tone_id: str | None,
    max_concurrent: int,
    use_v2: bool = True,
) -> list[Path] | None:
    """
    opal_parallel.generate_keyframes_opal 을 사용한 asyncio 병렬 생성.
    session.json 에서 Bearer Token 자동 로드.
    """
    try:
        sys.path.insert(0, str(Path(__file__).parent))
        sys.path.insert(0, str(Path(__file__).parent.parent / "opal-access"))
        from opal_auth import OpalAuthManager
        from opal_parallel import generate_keyframes_opal

        session = OpalAuthManager().load_session()
        if not session or not session.bearer_token:
            print("[키프레임] Opal 세션 없음 → 폴백")
            return None

        auth_info = {
            "token":   session.bearer_token,
            "cookies": session.cookie_header,
            "headers": {},
        }

        scenes = [(c.scene_text, c.index) for c in job.clips]

        result = asyncio.run(
            generate_keyframes_opal(
                scenes=scenes,
                art_style_id=art_style,
                auth_info=auth_info,
                out_dir=work_dir,
                emotion_id=emotion_id,
                tone_id=tone_id,
                max_concurrent=max_concurrent,
                use_v2=use_v2,
            )
        )
        return result if result else None

    except Exception as e:
        print(f"[키프레임] Opal 병렬 오류: {e} → 폴백")
        return None


def _extract_art_style_id(art_prompt: str) -> str:
    """art_prompt 문자열에서 화풍 ID를 추출합니다."""
    style_map = {
        "hollywood": "hollywood-sf",
        "cyberpunk": "hollywood-sf",
        "anime": "anime-sf",
        "ghibli": "ghibli-real",
        "ink": "ink-wash",
        "pixar": "pixar-3d",
        "noir": "neo-noir",
        "pop": "pop-art",
        "real": "reality",
        "sticker": "sticker-cutout",
    }
    lower = art_prompt.lower()
    for kw, style_id in style_map.items():
        if kw in lower:
            return style_id
    return "_default"
