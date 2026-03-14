import json
import os
from pathlib import Path
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROJECT_ROOT = Path(__file__).parent.parent.parent
GD_AUTH_DIR = PROJECT_ROOT / "apps" / "api" / "core" / "auth"
TOKEN_PATH = GD_AUTH_DIR / "token.json"

def get_drive_service():
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
    return build('drive', 'v3', credentials=creds)

def get_or_create_folder(service, folder_name, parent_id=None):
    query = f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    if parent_id:
        query += f" and '{parent_id}' in parents"
    results = service.files().list(q=query, fields="files(id, name)").execute()
    files = results.get('files', [])
    if files:
        return files[0]['id']
    else:
        file_metadata = {'name': folder_name, 'mimeType': 'application/vnd.google-apps.folder'}
        if parent_id: file_metadata['parents'] = [parent_id]
        folder = service.files().create(body=file_metadata, fields='id').execute()
        return folder.get('id')

def cleanup_drive():
    service = get_drive_service()
    
    # 1. 루트 폴더 확보
    query = "name = 'LinkDrop_Knowledge' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    roots = service.files().list(q=query, fields="files(id, name)").execute().get('files', [])
    if not roots: return
    root_id = roots[0]['id']

    # 2. 보관소 폴더 생성
    archive_id = get_or_create_folder(service, "99_과거_기록_보관소", root_id)
    
    # 3. 모든 폴더 조회 및 이동
    query = f"'{root_id}' in parents and trashed = false"
    items = service.files().list(q=query, fields="files(id, name, mimeType)").execute().get('files', [])
    
    active_folders = ["01_재료_하차장", "02_지식_서랍장", "03_조립_작업대", "04_출고_대기실", "99_과거_기록_보관소"]
    
    print("🧹 구글 드라이브 단순화 작업 중...")
    for item in items:
        if item['name'] not in active_folders:
            # 보관소로 이동 (기존 부모 제거, 새 부모 추가)
            file_id = item['id']
            file = service.files().get(fileId=file_id, fields='parents').execute()
            previous_parents = ",".join(file.get('parents'))
            service.files().update(fileId=file_id, addParents=archive_id, removeParents=previous_parents, fields='id, parents').execute()
            print(f"📦 이동 완료: {item['name']} ➡️ 99_과거_기록_보관소")

    print("🎉 드라이브 단순화 완료! (Active: 01, 02, 03, 04, 99)")

if __name__ == "__main__":
    cleanup_drive()
