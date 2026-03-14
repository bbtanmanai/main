import os
import json
import mimetypes
from pathlib import Path
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.auth.transport.requests import Request

# 경로 설정 (LinkDropV2 표준 구조)
PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "packages" / "data"
GD_AUTH_DIR = PROJECT_ROOT / "apps" / "api" / "core" / "auth"
TOKEN_PATH = GD_AUTH_DIR / "token.json"
CREDENTIALS_PATH = GD_AUTH_DIR / "credentials.json"

# 공정 중심 카테고리 매핑 (로컬 경로 -> 구글 드라이브 폴더명)
PROCESS_FOLDERS = {
    "01_재료_하차장": "01_재료_하차장",
    "02_지식_서랍장": "02_지식_서랍장",
    "03_조립_작업대": "03_조립_작업대",
    "04_출고_대기실": "04_출고_대기실"
}

def get_drive_service():
    """구글 드라이브 API 서비스 초기화"""
    if not TOKEN_PATH.exists():
        print(f"❌ 인증 토큰이 없습니다: {TOKEN_PATH}")
        return None

    with open(TOKEN_PATH, 'r') as token:
        token_data = json.load(token)
    
    creds = Credentials(
        token=token_data['access_token'],
        refresh_token=token_data.get('refresh_token'),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=token_data['scope'].split(' ')
    )

    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_PATH, 'w') as token:
            token.write(json.dumps({
                "access_token": creds.token,
                "refresh_token": creds.refresh_token,
                "scope": " ".join(creds.scopes),
                "token_type": "Bearer",
                "expiry_date": int(creds.expiry.timestamp() * 1000)
            }, indent=2))

    return build('drive', 'v3', credentials=creds)

def get_or_create_folder(service, folder_name, parent_id=None):
    """폴더가 존재하면 ID 반환, 없으면 생성"""
    query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    if parent_id:
        query += f" and '{parent_id}' in parents"
    
    results = service.files().list(q=query, fields="files(id, name)").execute()
    files = results.get('files', [])

    if files:
        return files[0]['id']
    else:
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        if parent_id:
            file_metadata['parents'] = [parent_id]
        
        folder = service.files().create(body=file_metadata, fields='id').execute()
        print(f"📁 드라이브 폴더 생성: {folder_name}")
        return folder.get('id')

def sync_recursive(service, local_path, parent_id):
    """로컬 구조를 드라이브에 재귀적으로 동기화"""
    for item in local_path.iterdir():
        if item.is_dir():
            folder_id = get_or_create_folder(service, item.name, parent_id)
            sync_recursive(service, item, folder_id)
        else:
            upload_file(service, item, parent_id)

def upload_file(service, file_path, folder_id):
    """파일 업로드 (중복 확인 포함)"""
    file_name = file_path.name
    query = f"name = '{file_name}' and '{folder_id}' in parents and trashed = false"
    results = service.files().list(q=query, fields="files(id, name)").execute()
    files = results.get('files', [])
    
    if files:
        return files[0]['id']

    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type:
        mime_type = 'application/octet-stream'
        
    file_metadata = {
        'name': file_name,
        'parents': [folder_id]
    }
    
    media = MediaFileUpload(str(file_path), mimetype=mime_type, resumable=True)
    file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
    print(f"✅ 업로드 완료: {file_name}")
    return file.get('id')

def main():
    service = get_drive_service()
    if not service:
        return

    print("🚀 [G-Drive Sync] 공정 중심 물류 시스템(Pipeline Sync) 가동")
    
    # 1. 최상위 폴더 'LinkDrop_Knowledge' 확보
    root_id = get_or_create_folder(service, "LinkDrop_Knowledge")
    
    # 2. 4대 핵심 공정 폴더 동기화
    for local_name, drive_name in PROCESS_FOLDERS.items():
        local_path = DATA_DIR / local_name
        if local_path.exists():
            print(f"📦 공정 구역 동기화 중: {drive_name}")
            folder_id = get_or_create_folder(service, drive_name, root_id)
            sync_recursive(service, local_path, folder_id)
    
    print("🎉 [G-Drive Sync] 로컬-드라이브 간 공정 명칭 동기화 완료!")

if __name__ == "__main__":
    main()
