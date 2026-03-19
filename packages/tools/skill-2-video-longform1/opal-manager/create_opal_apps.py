#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Opal App 대량 생성 스크립트
============================
A1(기존 App)을 Google Drive files.copy API로 복제하여
A2~A30 (총 29개)을 만들고 opal_apps_config.json을 자동 갱신합니다.

사용법:
    python create_opal_apps.py [--count 29] [--prefix "LinkDrop 롱폼"]

사전 준비:
    - opal_login.bat 실행 완료 (세션 + Bearer Token 필요)
    - 또는 setup_refresh_token.py 실행 완료
"""

from __future__ import annotations

import sys
import json
import time
import argparse
from pathlib import Path

# .env 로드
_ROOT_ENV = Path(__file__).parent.parent.parent.parent.parent / ".env"
if _ROOT_ENV.exists():
    for _line in _ROOT_ENV.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            import os as _os
            _os.environ.setdefault(_k.strip(), _v.strip())

# 인증 모듈
_OPAL_ACCESS = Path(__file__).parent.parent / "opal-access"
sys.path.insert(0, str(_OPAL_ACCESS))
from opal_auth import OpalAuthManager

CONFIG_PATH   = Path(__file__).parent / "opal_apps_config.json"
DRIVE_API     = "https://www.googleapis.com/drive/v3"
A1_FILE_ID    = "1YQTJjGO0VnQN5U38CE6hHNIhbcindUXt"
MAX_APPS      = 30


def copy_file(file_id: str, name: str, bearer_token: str) -> str | None:
    """Drive API files.copy 로 파일을 복제하고 새 파일 ID를 반환합니다."""
    import httpx

    url = f"{DRIVE_API}/files/{file_id}/copy"
    headers = {
        "Authorization": bearer_token,
        "Content-Type": "application/json",
    }
    body = {"name": name}

    try:
        r = httpx.post(url, json=body, headers=headers, timeout=30)
        r.raise_for_status()
        new_id = r.json().get("id", "")
        if not new_id:
            print(f"  [오류] 응답에 ID 없음: {r.text[:200]}")
            return None
        return new_id
    except Exception as e:
        print(f"  [오류] copy 실패 ({name}): {e}")
        return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Opal App 대량 복제")
    parser.add_argument("--count",  type=int, default=29, help="복제할 App 수 (기본 29 → A2~A30)")
    parser.add_argument("--prefix", default="LinkDrop 롱폼 편집실", help="App 이름 접두어")
    parser.add_argument("--delay",  type=float, default=1.0, help="요청 간 딜레이(초)")
    args = parser.parse_args()

    count = min(args.count, MAX_APPS - 1)  # 최대 A30까지

    # 인증
    auth = OpalAuthManager()
    bearer = auth.ensure_token()
    if not bearer:
        print("[오류] Bearer Token 없음. opal_login.bat 또는 setup_refresh_token.py 먼저 실행하세요.")
        return 1

    print(f"[인증] Bearer Token 확인 완료")

    # 기존 config 로드
    cfg: dict = {}
    if CONFIG_PATH.exists():
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

    existing_ids: list[str] = cfg.get("app_ids", [A1_FILE_ID])
    if A1_FILE_ID not in existing_ids:
        existing_ids.insert(0, A1_FILE_ID)

    # 이미 충분하면 스킵
    if len(existing_ids) >= MAX_APPS:
        print(f"이미 {len(existing_ids)}개 App이 등록되어 있습니다. (max={MAX_APPS})")
        return 0

    need = min(count, MAX_APPS - len(existing_ids))
    start_idx = len(existing_ids) + 1  # A2부터 (A1이 이미 있으므로)

    print(f"A{start_idx} ~ A{start_idx + need - 1} ({need}개) 복제를 시작합니다...")
    print(f"원본: {args.prefix} A1 ({A1_FILE_ID})")
    print()

    new_ids: list[str] = []
    for i in range(need):
        app_num = start_idx + i
        name = f"{args.prefix} A{app_num}"
        print(f"  [{i+1}/{need}] 복제 중: {name} ...", end=" ", flush=True)
        new_id = copy_file(A1_FILE_ID, name, bearer)
        if new_id:
            print(f"완료 → {new_id}")
            new_ids.append(new_id)
        else:
            print("실패 (건너뜀)")
        if i < need - 1:
            time.sleep(args.delay)

    # config 업데이트
    all_ids = existing_ids + new_ids
    cfg["app_ids"] = all_ids
    cfg["max_concurrent"] = min(len(all_ids), MAX_APPS)
    cfg.pop("_comment", None)
    cfg["_comment"] = (
        f"Opal A계정 App 목록 (총 {len(all_ids)}개). "
        "각 App이 병렬 키프레임 생성 슬롯이 됩니다."
    )

    CONFIG_PATH.write_text(json.dumps(cfg, indent=2, ensure_ascii=False))

    print()
    print(f"[완료] {len(new_ids)}개 복제 성공 (총 {len(all_ids)}개 등록)")
    print(f"  설정 파일: {CONFIG_PATH}")
    print()
    print("각 App URL:")
    for idx, fid in enumerate(all_ids, 1):
        print(f"  A{idx}: https://opal.google/edit/{fid}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
