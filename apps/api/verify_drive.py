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

def verify_drive_structure():
    service = get_drive_service()
    
    # 1. 'LinkDrop_Knowledge' 루트 폴더 찾기
    query = "name = 'LinkDrop_Knowledge' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    results = service.files().list(q=query, fields="files(id, name)").execute()
    roots = results.get('files', [])
    
    if not roots:
        print("❌ 'LinkDrop_Knowledge' 폴더를 찾을 수 없습니다.")
        return

    root_id = roots[0]['id']
    print(f"✅ Root Folder: {roots[0]['name']} (ID: {root_id})")
    
    # 2. 하위 공정 폴더 리스트업
    query = f"'{root_id}' in parents and trashed = false"
    results = service.files().list(q=query, fields="files(id, name, mimeType)").execute()
    items = results.get('files', [])
    
    print("\n📂 [실시간 구글 드라이브 공정 구역 목록]")
    print("-" * 50)
    for item in items:
        status = "📁 Folder" if item['mimeType'] == 'application/vnd.google-apps.folder' else "📄 File"
        print(f"{status} | {item['name']} (ID: {item['id']})")
    print("-" * 50)

if __name__ == "__main__":
    verify_drive_structure()
