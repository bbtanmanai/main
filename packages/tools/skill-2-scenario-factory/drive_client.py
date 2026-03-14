#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Google Drive 연동 클라이언트
- 7점+ 크롤 원본 데이터 JSON 백업
- 서비스 계정(service_account.json) 또는 OAuth 지원
"""
from __future__ import annotations

import io
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

# Google Drive API
try:
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseUpload
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request
    import google.auth
    DRIVE_AVAILABLE = True
except ImportError:
    DRIVE_AVAILABLE = False

SCOPES = ["https://www.googleapis.com/auth/drive.file"]
CREDENTIALS_FILE = Path(__file__).parent / "credentials.json"
TOKEN_FILE        = Path(__file__).parent / "drive_token.json"

# credentials.json 폴백: apps/api/core/auth/credentials.json
_FALLBACK_CREDS = Path(__file__).parent.parent.parent.parent / "apps" / "api" / "core" / "auth" / "credentials.json"


def _get_drive_service():
    """Drive API 서비스 객체 반환 (OAuth2 방식)."""
    if not DRIVE_AVAILABLE:
        raise RuntimeError("google-api-python-client 미설치. pip install google-api-python-client")

    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow

    creds = None

    # 저장된 토큰 로드
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    # 토큰 없거나 만료 → 갱신 or 새 인증
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            creds_file = CREDENTIALS_FILE if CREDENTIALS_FILE.exists() else _FALLBACK_CREDS
            if not creds_file.exists():
                raise RuntimeError(
                    "Google Drive 인증 파일 없음.\n"
                    f"  credentials.json을 {CREDENTIALS_FILE} 에 배치하세요."
                )
            flow = InstalledAppFlow.from_client_secrets_file(str(creds_file), SCOPES)
            creds = flow.run_local_server(port=0)

        # 토큰 저장 (다음 실행부터 재사용)
        TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")

    return build("drive", "v3", credentials=creds)


def _get_or_create_folder(service, folder_name: str, parent_id: Optional[str] = None) -> str:
    """폴더 존재 확인 후 없으면 생성. 폴더 ID 반환."""
    query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    if parent_id:
        query += f" and '{parent_id}' in parents"

    res = service.files().list(q=query, fields="files(id, name)").execute()
    files = res.get("files", [])
    if files:
        return files[0]["id"]

    meta = {
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder",
    }
    if parent_id:
        meta["parents"] = [parent_id]

    folder = service.files().create(body=meta, fields="id").execute()
    return folder["id"]


def backup_crawl_data(data: list[dict], folder_name: str = "LinkDrop-ScenarioFactory") -> str:
    """
    7점+ 크롤 데이터를 Google Drive에 JSON으로 백업.
    반환: 업로드된 파일 ID
    """
    if not DRIVE_AVAILABLE:
        print("[Drive] google-api-python-client 없음 → 백업 건너뜀")
        return ""

    try:
        service = _get_drive_service()

        # 루트 폴더 확보
        root_id = _get_or_create_folder(service, folder_name)
        raw_id  = _get_or_create_folder(service, "raw_crawl_data", parent_id=root_id)

        # 파일명: raw_crawl_YYYYMMDD_HHMMSS.json
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename  = f"raw_crawl_{timestamp}.json"

        content   = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        media     = MediaIoBaseUpload(io.BytesIO(content), mimetype="application/json")
        meta      = {"name": filename, "parents": [raw_id]}

        file = service.files().create(body=meta, media_body=media, fields="id").execute()
        file_id = file.get("id", "")
        print(f"[Drive] 백업 완료: {filename} (id={file_id})")
        return file_id

    except Exception as e:
        print(f"[Drive] 백업 실패 (건너뜀): {e}")
        return ""


def backup_scenarios(scenarios: list[dict], template_id: str,
                     folder_name: str = "LinkDrop-ScenarioFactory") -> str:
    """생성된 시나리오를 Google Drive에 템플릿별 폴더로 백업."""
    if not DRIVE_AVAILABLE:
        return ""
    try:
        service = _get_drive_service()
        root_id     = _get_or_create_folder(service, folder_name)
        scen_id     = _get_or_create_folder(service, "scenarios",    parent_id=root_id)
        tmpl_id_dir = _get_or_create_folder(service, template_id,   parent_id=scen_id)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename  = f"{template_id}_{timestamp}.json"
        content   = json.dumps(scenarios, ensure_ascii=False, indent=2).encode("utf-8")
        media     = MediaIoBaseUpload(io.BytesIO(content), mimetype="application/json")
        meta      = {"name": filename, "parents": [tmpl_id_dir]}

        file = service.files().create(body=meta, media_body=media, fields="id").execute()
        file_id = file.get("id", "")
        print(f"[Drive] 시나리오 백업: {filename} (id={file_id})")
        return file_id

    except Exception as e:
        print(f"[Drive] 시나리오 백업 실패 (건너뜀): {e}")
        return ""
