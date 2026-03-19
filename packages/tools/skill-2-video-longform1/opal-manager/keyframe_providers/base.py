"""
키프레임 Provider 추상 인터페이스
===================================
NLM / Opal / Pillow 등 어떤 구현체로도 교체 가능.

계약:
  - generate(scenes, out_dir) → list[Path]
  - 길이는 반드시 len(scenes)와 같아야 함
  - 실패한 씬은 Pillow 폴백으로 채워야 함 (None 금지)
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class SceneRequest:
    index: int
    scene_text: str
    art_style_id: str = "hollywood-sf"
    art_prompt: str | None = None  # None이면 art_style_id 기반 기본 프롬프트 사용


class KeyframeProvider(ABC):
    """키프레임 생성 공급자 인터페이스 — NLM / Opal / Pillow 교체 가능"""

    @property
    @abstractmethod
    def name(self) -> str:
        """공급자 이름 (로그/설정용)"""
        ...

    @abstractmethod
    def generate(self, scenes: list[SceneRequest], out_dir: Path) -> list[Path]:
        """
        씬 목록 → keyframe_NN.png 경로 목록 반환.

        Args:
            scenes:   SceneRequest 목록 (index 순서 보장)
            out_dir:  PNG 저장 디렉터리 (호출 전 존재 보장)

        Returns:
            len(scenes) 길이의 Path 목록 (index 순서)
        """
        ...
