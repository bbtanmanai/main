"""
Opal App Pool Manager
=====================
최대 30개 Opal App을 병렬 작업 슬롯으로 관리합니다.

- App 수 < 요청 씬 수: 같은 App을 라운드로빈으로 재사용 (세마포어로 동시성 제한)
- App 수 = 요청 씬 수: 완전 병렬 (씬 1개 = App 1개 = 동시 실행)
- App 수 > 30:        30개로 제한

사용법:
    pool = get_pool()          # 싱글톤
    app_id = pool.acquire()    # 슬롯 점유 (없으면 대기)
    try:
        ...                    # App으로 작업
    finally:
        pool.release(app_id)   # 슬롯 반환 (필수)

App 추가:
    opal_apps_config.json 의 app_ids 배열에 Opal 파일 ID 추가
    (https://opal.google/edit/<FILE_ID> 에서 ID 확인)
"""

from __future__ import annotations

import json
import threading
from pathlib import Path

_CONFIG_PATH = Path(__file__).parent / "opal_apps_config.json"
MAX_APPS = 30


class OpalAppPool:
    """
    세마포어 기반 Opal App 풀.

    - acquire(): 사용 가능한 App ID 반환 (없으면 블로킹 대기)
    - release(): App ID를 풀에 반환
    """

    def __init__(self, config_path: Path = _CONFIG_PATH) -> None:
        cfg: dict = {}
        if config_path.exists():
            try:
                cfg = json.loads(config_path.read_text(encoding="utf-8"))
            except Exception:
                pass

        app_ids: list[str] = cfg.get("app_ids", [])
        max_concurrent: int = min(cfg.get("max_concurrent", MAX_APPS), MAX_APPS)

        if not app_ids:
            # 기본값: 기존 단일 App
            app_ids = ["1HveRb71BKf_XljWZxILm5B276qA7A8oC"]

        # 슬롯 수만큼 App ID 순환 채우기 (App < max_concurrent이면 재사용)
        slots: list[str] = []
        cycle_idx = 0
        for _ in range(min(max_concurrent, len(app_ids) * MAX_APPS)):
            slots.append(app_ids[cycle_idx % len(app_ids)])
            cycle_idx += 1
            if len(slots) >= max_concurrent:
                break

        self._lock = threading.Lock()
        self._available: list[str] = slots[:]
        self._sem = threading.Semaphore(len(self._available))
        self._total = len(self._available)

        print(
            f"[OpalAppPool] {len(app_ids)}개 App → {self._total}개 슬롯 준비 "
            f"(max_concurrent={max_concurrent})"
        )

    # ── 슬롯 점유 / 반환 ─────────────────────────────────────────────────────

    def acquire(self) -> str:
        """사용 가능한 슬롯을 점유하고 App ID를 반환합니다 (블로킹)."""
        self._sem.acquire()
        with self._lock:
            return self._available.pop()

    def release(self, app_id: str) -> None:
        """App ID를 풀에 반환합니다."""
        with self._lock:
            self._available.append(app_id)
        self._sem.release()

    @property
    def total_slots(self) -> int:
        return self._total

    @property
    def available_slots(self) -> int:
        with self._lock:
            return len(self._available)


# ── 싱글톤 ───────────────────────────────────────────────────────────────────

_pool_instance: OpalAppPool | None = None
_pool_lock = threading.Lock()


def get_pool() -> OpalAppPool:
    """프로세스 단위 OpalAppPool 싱글톤을 반환합니다."""
    global _pool_instance
    with _pool_lock:
        if _pool_instance is None:
            _pool_instance = OpalAppPool()
        return _pool_instance


def reset_pool() -> None:
    """싱글톤을 초기화합니다 (설정 변경 후 재로드 시 사용)."""
    global _pool_instance
    with _pool_lock:
        _pool_instance = None
