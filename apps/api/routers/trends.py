"""
trends.py — 트랜드 수집 라우터
Vercel cron-trends route.ts 에서 HTTP로 호출.
Python spawn 없이 직접 collect_trends 모듈을 임포트하여 실행.
"""
from __future__ import annotations

import sys
import json
import subprocess
from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/trends", tags=["trends"])

_SCRIPT = Path(__file__).parent.parent.parent.parent / "packages" / "tools" / "skill-0-youtube-trend-fetcher" / "collect_trends.py"


@router.get("/collect")
def collect_trends():
    """트랜드 수집 실행 — collect_trends.py 를 subprocess로 호출하여 JSON 반환."""
    if not _SCRIPT.exists():
        raise HTTPException(status_code=500, detail=f"collect_trends.py 없음: {_SCRIPT}")

    result = subprocess.run(
        [sys.executable, "-X", "utf8", str(_SCRIPT)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=30,
        cwd=str(_SCRIPT.parent),
    )

    if result.returncode != 0 or not result.stdout.strip():
        err = result.stderr.strip().splitlines()[-2:] if result.stderr else ["알 수 없는 오류"]
        raise HTTPException(status_code=500, detail=" | ".join(err))

    try:
        return json.loads(result.stdout.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"JSON 파싱 실패: {result.stdout[:200]}")
