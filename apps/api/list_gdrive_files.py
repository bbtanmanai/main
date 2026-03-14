import json
import os
from pathlib import Path
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROJECT_ROOT = Path(__file__).parent.parent.parent
GD_AUTH_DIR = PROJECT_ROOT / "packages" / "mcp-servers" / "gdrive-save-mcp"
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

def list_files_recursive(service, folder_id, category):
    all_files = []
    query = f"'{folder_id}' in parents and trashed = false"
    results = service.files().list(q=query, fields="files(id, name, mimeType)").execute()
    items = results.get('files', [])

    for item in items:
        if item['mimeType'] == 'application/vnd.google-apps.folder':
            all_files.extend(list_files_recursive(service, item['id'], category))
        else:
            # MIME 타입에 따른 doc_type 매핑
            doc_type = "doc"
            if "pdf" in item['mimeType']:
                doc_type = "pdf"
            elif "presentation" in item['mimeType']:
                doc_type = "slides"
            elif "spreadsheet" in item['mimeType']:
                doc_type = "sheets"
            
            all_files.append({
                "id": item['id'], 
                "name": item['name'], 
                "category": category,
                "doc_type": doc_type
            })
    return all_files

def main():
    service = get_drive_service()
    
    # 이전 로그에서 확인된 폴더 ID
    folders = {
        "expert": "114_HrwjlavXrc-ci3XDQS6vlIN9y17Fq",
        "refined": "1gvV1xLSu64-JPh2IGJ337GesheupoIhm"
    }
    
    all_files = []
    for name, fid in folders.items():
        all_files.extend(list_files_recursive(service, fid, name))
            
    print(json.dumps(all_files, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
