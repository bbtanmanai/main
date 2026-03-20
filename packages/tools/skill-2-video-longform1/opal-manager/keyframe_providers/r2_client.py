#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cloudflare R2 배경 이미지 라이브러리 클라이언트
boto3 S3 호환 API 사용

버킷: flux-bg-library
경로 규칙: {style_id}/{index:03d}.png  (예: ghibli-real/000.png)
공개 URL: https://pub-3004911807a7429c89c576d1aa468160.r2.dev/{style_id}/{index:03d}.png
"""
import os, random
from pathlib import Path
from typing import Optional

import boto3
from botocore.config import Config

# ── 환경 변수 로드 ──────────────────────────────────────────────────────────
def _load_env():
    root = Path(__file__).parent.parent.parent.parent.parent.parent
    env_path = root / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

_load_env()

R2_ENDPOINT   = os.environ.get("R2_ENDPOINT", "")
R2_BUCKET     = os.environ.get("R2_BUCKET", "flux-bg-library")
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL", "").rstrip("/")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "")


def _client():
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


def r2_key(style_id: str, index: int) -> str:
    return f"{style_id}/{index:03d}.png"


def public_url(style_id: str, index: int) -> str:
    return f"{R2_PUBLIC_URL}/{r2_key(style_id, index)}"


# ── 업로드 ──────────────────────────────────────────────────────────────────
def upload_bg(local_path: str | Path, style_id: str, index: int) -> str:
    """
    로컬 PNG를 R2에 업로드하고 공개 URL 반환.

    Returns:
        공개 URL (str)
    """
    key = r2_key(style_id, index)
    _client().upload_file(
        str(local_path),
        R2_BUCKET,
        key,
        ExtraArgs={"ContentType": "image/png"},
    )
    url = public_url(style_id, index)
    print(f"  ✅ 업로드: {key} → {url}")
    return url


# ── 목록 조회 ────────────────────────────────────────────────────────────────
def list_bgs(style_id: str) -> list[dict]:
    """
    특정 화풍의 R2 저장 이미지 목록 반환.

    Returns:
        [{"key": ..., "url": ..., "index": ...}, ...]
    """
    s3 = _client()
    paginator = s3.get_paginator("list_objects_v2")
    items = []
    for page in paginator.paginate(Bucket=R2_BUCKET, Prefix=f"{style_id}/"):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            fname = key.split("/")[-1]
            try:
                idx = int(fname.replace(".png", ""))
            except ValueError:
                idx = -1
            items.append({
                "key":   key,
                "url":   f"{R2_PUBLIC_URL}/{key}",
                "index": idx,
            })
    return sorted(items, key=lambda x: x["index"])


def count_bgs(style_id: str) -> int:
    return len(list_bgs(style_id))


# ── 랜덤 선택 ────────────────────────────────────────────────────────────────
def random_bg_urls(style_id: str, count: int = 3) -> list[str]:
    """
    화풍 라이브러리에서 중복 없이 랜덤 N개 URL 반환.
    라이브러리가 비어 있으면 빈 리스트 반환.
    """
    items = list_bgs(style_id)
    if not items:
        return []
    chosen = random.sample(items, min(count, len(items)))
    return [c["url"] for c in chosen]


# ── 존재 여부 확인 ───────────────────────────────────────────────────────────
def exists(style_id: str, index: int) -> bool:
    try:
        _client().head_object(Bucket=R2_BUCKET, Key=r2_key(style_id, index))
        return True
    except Exception:
        return False


# ── 직접 실행: 연결 테스트 ───────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"[R2 연결 테스트]")
    print(f"  엔드포인트: {R2_ENDPOINT}")
    print(f"  버킷:       {R2_BUCKET}")
    print(f"  공개 URL:   {R2_PUBLIC_URL}")

    try:
        s3 = _client()
        # ListBuckets 대신 특정 버킷 객체 목록으로 연결 테스트
        resp = s3.list_objects_v2(Bucket=R2_BUCKET, MaxKeys=5)
        count = resp.get("KeyCount", 0)
        print(f"  버킷 '{R2_BUCKET}' 객체 수 (최대5): {count}")
        print("  ✅ 연결 성공")
    except Exception as e:
        print(f"  ❌ 연결 실패: {e}")
