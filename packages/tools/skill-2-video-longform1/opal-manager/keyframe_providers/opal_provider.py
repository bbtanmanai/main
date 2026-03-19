"""
Opal 병렬 키프레임 Provider
==============================
AppCatalyst generateWebpageStream → Playwright PNG.
기존 opal_parallel.py 래퍼.
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from .base import KeyframeProvider, SceneRequest


class OpalKeyframeProvider(KeyframeProvider):
    """
    Opal (AppCatalyst) HTML 생성 → Playwright PNG Provider.

    Args:
        max_concurrent: asyncio.Semaphore 값 (동시 API 요청 수)
        emotion_id:     감정 ID (scene_prompt_builder 큐레이션 프리셋)
        tone_id:        톤앤매너 ID
        use_v2:         V2 프롬프트 빌더 사용 여부
    """

    def __init__(
        self,
        max_concurrent: int = 5,
        emotion_id: str | None = None,
        tone_id: str | None = None,
        use_v2: bool = True,
    ):
        self.max_concurrent = max_concurrent
        self.emotion_id = emotion_id
        self.tone_id = tone_id
        self.use_v2 = use_v2

    @property
    def name(self) -> str:
        return "opal"

    def generate(self, scenes: list[SceneRequest], out_dir: Path) -> list[Path]:
        result = self._opal_generate(scenes, out_dir)
        if result and len(result) == len(scenes):
            return result

        print("[Opal Provider] 실패 → Pillow 폴백")
        from .pillow_provider import PillowKeyframeProvider
        return PillowKeyframeProvider().generate(scenes, out_dir)

    def _opal_generate(self, scenes: list[SceneRequest], out_dir: Path) -> list[Path] | None:
        try:
            _opal_access = Path(__file__).parent.parent.parent / "opal-access"
            sys.path.insert(0, str(Path(__file__).parent.parent))
            sys.path.insert(0, str(_opal_access))

            from opal_auth import OpalAuthManager
            from opal_parallel import generate_keyframes_opal

            session = OpalAuthManager().load_session()
            if not session or not session.bearer_token:
                print("[Opal Provider] 세션 없음")
                return None

            auth_info = {
                "token":   session.bearer_token,
                "cookies": session.cookie_header,
                "headers": {},
            }

            art_style_id = scenes[0].art_style_id if scenes else "_default"
            opal_scenes = [(s.scene_text, s.index) for s in scenes]

            result = asyncio.run(
                generate_keyframes_opal(
                    scenes=opal_scenes,
                    art_style_id=art_style_id,
                    auth_info=auth_info,
                    out_dir=out_dir,
                    emotion_id=self.emotion_id,
                    tone_id=self.tone_id,
                    max_concurrent=self.max_concurrent,
                    use_v2=self.use_v2,
                )
            )
            return result if result else None

        except Exception as e:
            print(f"[Opal Provider] 오류: {e}")
            return None
