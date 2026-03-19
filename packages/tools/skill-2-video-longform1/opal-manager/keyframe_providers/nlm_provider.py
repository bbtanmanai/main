"""
NotebookLM slide_deck 키프레임 Provider
=========================================
slide_deck → PDF → 1920×1080 PNG 변환.
화풍별 프롬프트는 nlm_styles.json 에서 로드.
"""
from __future__ import annotations

import asyncio
import concurrent.futures as _cf
import json
import sys
import time
from pathlib import Path

from .base import KeyframeProvider, SceneRequest

KEYFRAME_W = 1920
KEYFRAME_H = 1080

NLM_POLL_INTERVAL  = 10   # 초
NLM_MAX_WAIT       = 600  # 초 (10분, NLM 슬라이드 생성은 최대 10분 소요)
NLM_CREATE_TIMEOUT = 30   # 초

_NLM_STYLES_JSON = Path(__file__).parent.parent / "nlm_styles.json"


def _load_nlm_style(style_id: str) -> dict:
    """nlm_styles.json에서 style_id에 해당하는 설정 로드."""
    try:
        data = json.loads(_NLM_STYLES_JSON.read_text(encoding="utf-8"))
        return data.get(style_id) or data.get("_default", {})
    except Exception:
        return {"visual_style": "auto_select", "slide_prompt": ""}


class NLMKeyframeProvider(KeyframeProvider):
    """
    NotebookLM slide_deck → PDF → PNG Provider.

    Args:
        notebook_id: NotebookLM 노트북 UUID
    """

    def __init__(self, notebook_id: str):
        self.notebook_id = notebook_id

    @property
    def name(self) -> str:
        return "nlm"

    def generate(self, scenes: list[SceneRequest], out_dir: Path) -> list[Path]:
        result = self._nlm_generate(scenes, out_dir)
        if result and len(result) == len(scenes):
            return result

        # NLM 실패 → Pillow 폴백
        print("[NLM Provider] 실패 → Pillow 폴백")
        from .pillow_provider import PillowKeyframeProvider
        return PillowKeyframeProvider().generate(scenes, out_dir)

    def _nlm_generate(self, scenes: list[SceneRequest], out_dir: Path) -> list[Path] | None:
        try:
            import httpx
            from notebooklm_tools import NotebookLMClient
            from notebooklm_tools.core.auth import load_cached_tokens
            from notebooklm_tools.services import studio as nlm_studio

            tokens = load_cached_tokens()
            if not tokens:
                print("[NLM Provider] 인증 없음")
                return None

            client = NotebookLMClient(
                cookies=tokens.cookies,
                csrf_token=tokens.csrf_token,
                session_id=tokens.session_id,
            )

            # ── 화풍별 전용 노트북 선택 ───────────────────────────────────────
            art_style_id = scenes[0].art_style_id if scenes else "_default"
            style_config = _load_nlm_style(art_style_id)
            slide_prompt = style_config.get("slide_prompt", "")

            # 화풍 전용 노트북이 있으면 사용, 없으면 기본 노트북
            style_notebook = style_config.get("notebook_id", "")
            if style_notebook:
                self.notebook_id = style_notebook
                print(f"[NLM Provider] 화풍 전용 노트북 사용: {art_style_id} → {style_notebook[:16]}...")

            _art_note_id = None  # 화풍 노트 주입 불필요 (전용 노트북에 소스로 선주입됨)

            # ── 씬별 단어 1개로 slide_deck 생성 ──────────────────────────────
            import re as _re

            # 씬 텍스트에서 따옴표/강조 단어 추출, 없으면 None
            def _pick_word(text: str) -> str | None:
                # '단어' 또는 "단어" 패턴
                m = _re.search(r"['\u2018\u2019\u201C\u201D\"'](.+?)['\u2018\u2019\u201C\u201D\"']", text)
                if m and len(m.group(1)) <= 10:
                    return m.group(1)
                return None

            # 시나리오 전체 대표 키워드 (topic 또는 첫 씬 첫 단어)
            fallback = scenes[0].scene_text.split()[0] if scenes else "주제"

            keywords = []
            for s in scenes:
                w = _pick_word(s.scene_text)
                keywords.append(w if w else fallback)

            focus = (
                f"[화풍 지시] 노트의 스타일을 반드시 적용하여 슬라이드 {len(scenes)}개를 생성하세요.\n"
                f"슬라이드에 텍스트를 절대 넣지 마세요.\n"
                f"각 슬라이드의 주제: {', '.join(keywords)}"
            )

            print(f"[NLM Provider] slide_deck 생성 중... ({len(scenes)}개 씬, style={art_style_id})")
            print(f"[NLM Provider] 키워드: {', '.join(keywords)}")

            pool = _cf.ThreadPoolExecutor(max_workers=1)
            fut = pool.submit(
                nlm_studio.create_artifact,
                client=client,
                notebook_id=self.notebook_id,
                artifact_type="slide_deck",
                custom_prompt=focus,
                slide_format="detailed_deck",
                language="ko",
            )
            try:
                result = fut.result(timeout=NLM_CREATE_TIMEOUT)
            except _cf.TimeoutError:
                pool.shutdown(wait=False)
                print(f"[NLM Provider] create_artifact 타임아웃 ({NLM_CREATE_TIMEOUT}s)")
                return None
            finally:
                pool.shutdown(wait=False)

            if not result or not result.get("artifact_id"):
                print("[NLM Provider] 아티팩트 생성 실패")
                return None

            artifact_id = result["artifact_id"]
            print(f"[NLM Provider] 아티팩트 {artifact_id[:16]}... 완료 대기 중...")

            # ── 완료 폴링 ────────────────────────────────────────────────────
            slide_url: str | None = None
            elapsed = 0
            while elapsed < NLM_MAX_WAIT:
                time.sleep(NLM_POLL_INTERVAL)
                elapsed += NLM_POLL_INTERVAL
                try:
                    status_result = nlm_studio.get_studio_status(client, self.notebook_id)
                    target = next(
                        (a for a in status_result.get("artifacts", [])
                         if a.get("artifact_id") == artifact_id),
                        None,
                    )
                    if target:
                        st  = target.get("status", "")
                        url = target.get("slide_deck_url") or ""
                        if url or st in ("completed", "ready", "done"):
                            slide_url = url or None
                            print(f"[NLM Provider] 슬라이드 완료! ({elapsed}초)")
                            break
                        elif st in ("failed", "error"):
                            print("[NLM Provider] 슬라이드 생성 실패")
                            return None
                        else:
                            print(f"[NLM Provider]   대기 {elapsed}초 (status={st})")
                    else:
                        print(f"[NLM Provider]   대기 {elapsed}초 (미조회)")
                except Exception as e:
                    print(f"[NLM Provider] 상태 조회 오류: {e}")
            else:
                print("[NLM Provider] 타임아웃")
                return None

            # ── PDF 다운로드 ──────────────────────────────────────────────────
            pdf_path = out_dir / "slides_nlm.pdf"
            print("[NLM Provider] PDF 다운로드 중...")

            downloaded = False

            # 1순위: slide_url 직접 다운로드
            if slide_url:
                try:
                    raw = tokens.cookies or {}
                    if isinstance(raw, list):
                        cookie_hdr = "; ".join(
                            f"{c['name']}={c['value']}" for c in raw
                            if "name" in c and "value" in c
                        )
                    else:
                        cookie_hdr = "; ".join(f"{k}={v}" for k, v in raw.items())
                    hdrs = {"Cookie": cookie_hdr} if cookie_hdr else {}
                    with httpx.Client(timeout=60, follow_redirects=True) as hx:
                        resp = hx.get(slide_url, headers=hdrs)
                        resp.raise_for_status()
                        content = resp.content
                    if content[:4] == b"%PDF":
                        pdf_path.write_bytes(content)
                        downloaded = True
                    else:
                        print("[NLM Provider] 직접 URL: PDF 아님 (인증 만료) → download_async 시도")
                except Exception as e:
                    print(f"[NLM Provider] 직접 URL 오류: {e} → download_async 시도")

            # 2순위: download_async
            if not downloaded:
                from notebooklm_tools.services import downloads as nlm_dl

                async def _dl() -> None:
                    await nlm_dl.download_async(
                        client=client,
                        notebook_id=self.notebook_id,
                        artifact_type="slide_deck",
                        output_path=str(pdf_path),
                        artifact_id=artifact_id,
                        slide_deck_format="pdf",
                    )
                asyncio.run(_dl())

            if not pdf_path.exists() or pdf_path.stat().st_size < 1024:
                print("[NLM Provider] PDF 다운로드 실패")
                return None
            with open(pdf_path, "rb") as f:
                if f.read(4) != b"%PDF":
                    print("[NLM Provider] 다운로드 파일이 PDF가 아님 (인증 만료)")
                    pdf_path.unlink(missing_ok=True)
                    return None

            print(f"[NLM Provider] PDF {pdf_path.stat().st_size // 1024}KB → PNG 변환")
            return _pdf_to_pngs(pdf_path, len(scenes), out_dir)

        except Exception as e:
            print(f"[NLM Provider] 오류: {e}")
            return None


def _pdf_to_pngs(pdf_path: Path, target_count: int, out_dir: Path) -> list[Path]:
    """PDF → 씬별 PNG 변환."""
    import fitz
    from PIL import Image

    doc = fitz.open(str(pdf_path))
    page_count = len(doc)

    page_indices = [
        min(int(i * page_count / target_count), page_count - 1)
        for i in range(target_count)
    ]

    png_paths: list[Path] = []
    for scene_i, page_i in enumerate(page_indices):
        page = doc[page_i]
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat, alpha=False)

        slide_img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        scale = min(KEYFRAME_W / slide_img.width, KEYFRAME_H / slide_img.height)
        new_w = int(slide_img.width * scale)
        new_h = int(slide_img.height * scale)
        scaled = slide_img.resize((new_w, new_h), Image.LANCZOS)

        canvas = Image.new("RGB", (KEYFRAME_W, KEYFRAME_H), (25, 30, 45))
        canvas.paste(scaled, ((KEYFRAME_W - new_w) // 2, (KEYFRAME_H - new_h) // 2))

        out = out_dir / f"keyframe_{scene_i:02d}.png"
        canvas.save(str(out), "PNG")
        png_paths.append(out)

    doc.close()
    print(f"[NLM Provider] PDF {page_count}p → PNG {target_count}개 완료")
    return png_paths


def _video_to_keyframes(mp4_path: Path, target_count: int, out_dir: Path) -> list[Path]:
    """NLM video MP4에서 균등 간격 키프레임 PNG 추출 (FFmpeg)."""
    import subprocess
    from PIL import Image

    # 영상 길이 확인
    probe_cmd = [
        "ffprobe", "-v", "quiet", "-print_format", "json",
        "-show_format", str(mp4_path),
    ]
    try:
        probe = subprocess.run(probe_cmd, capture_output=True, text=True)
        duration = float(json.loads(probe.stdout)["format"]["duration"])
    except Exception:
        duration = 60.0

    # 균등 간격 타임스탬프 (앞뒤 여백 10% 제외)
    margin = duration * 0.1
    usable = duration - margin * 2
    timestamps = [
        margin + (usable * i / max(target_count - 1, 1))
        for i in range(target_count)
    ]

    png_paths: list[Path] = []
    for scene_i, ts in enumerate(timestamps):
        raw_path = out_dir / f"_raw_frame_{scene_i:02d}.png"
        out_path = out_dir / f"keyframe_{scene_i:02d}.png"

        # FFmpeg로 프레임 추출
        cmd = [
            "ffmpeg", "-y", "-ss", f"{ts:.2f}",
            "-i", str(mp4_path),
            "-frames:v", "1",
            "-q:v", "2",
            str(raw_path),
        ]
        subprocess.run(cmd, capture_output=True)

        if not raw_path.exists():
            # 추출 실패 시 빈 캔버스
            canvas = Image.new("RGB", (KEYFRAME_W, KEYFRAME_H), (25, 30, 45))
            canvas.save(str(out_path), "PNG")
            png_paths.append(out_path)
            continue

        # 1920×1080으로 리사이즈 + 중앙 배치
        frame = Image.open(raw_path)
        scale = min(KEYFRAME_W / frame.width, KEYFRAME_H / frame.height)
        new_w = int(frame.width * scale)
        new_h = int(frame.height * scale)
        scaled = frame.resize((new_w, new_h), Image.LANCZOS)

        canvas = Image.new("RGB", (KEYFRAME_W, KEYFRAME_H), (25, 30, 45))
        canvas.paste(scaled, ((KEYFRAME_W - new_w) // 2, (KEYFRAME_H - new_h) // 2))
        canvas.save(str(out_path), "PNG")
        png_paths.append(out_path)

        # 임시 파일 삭제
        raw_path.unlink(missing_ok=True)

    print(f"[NLM Provider] MP4 {duration:.0f}초 → PNG {len(png_paths)}개 키프레임 추출 완료")
    return png_paths
