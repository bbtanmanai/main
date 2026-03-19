"""
키프레임 Provider 팩토리
========================
사용법:
    from keyframe_providers import get_provider, SceneRequest

    provider = get_provider("nlm", notebook_id="...")
    # 또는
    provider = get_provider("opal", max_concurrent=5)
    # 또는
    provider = get_provider("pillow")

    paths = provider.generate(scenes, out_dir)
"""
from __future__ import annotations

from .base import KeyframeProvider, SceneRequest
from .nlm_provider import NLMKeyframeProvider
from .opal_provider import OpalKeyframeProvider
from .pillow_provider import PillowKeyframeProvider

_REGISTRY: dict[str, type[KeyframeProvider]] = {
    "nlm":    NLMKeyframeProvider,
    "opal":   OpalKeyframeProvider,
    "pillow": PillowKeyframeProvider,
}


def get_provider(name: str, **kwargs) -> KeyframeProvider:
    """
    Provider 팩토리.

    Args:
        name:   "nlm" | "opal" | "pillow"
        kwargs: Provider 생성자 인자
                - nlm:    notebook_id (필수)
                - opal:   max_concurrent, emotion_id, tone_id, use_v2
                - pillow: (없음)

    Returns:
        KeyframeProvider 인스턴스

    Raises:
        ValueError: 알 수 없는 provider name
    """
    if name not in _REGISTRY:
        available = list(_REGISTRY.keys())
        raise ValueError(f"알 수 없는 provider: {name!r} (사용 가능: {available})")
    return _REGISTRY[name](**kwargs)


def list_providers() -> list[str]:
    return list(_REGISTRY.keys())


__all__ = [
    "KeyframeProvider", "SceneRequest",
    "NLMKeyframeProvider", "OpalKeyframeProvider", "PillowKeyframeProvider",
    "get_provider", "list_providers",
]
