import os
import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from dotenv import load_dotenv

class DriveSyncer:
    """
    [Skill-3-06] 출고 동기화 에이전트 (독립형)
    - 최종 결과물(GOLD 데이터, 설계도 등)을 구글 드라이브로 배송
    - 독립적인 구글 API 인증 및 업로드 로직 보유
    """
    def __init__(self, 
                 input_base: str = "packages/data/02_지식_서랍장",
                 token_path: str = "apps/api/core/auth/token.json"):
        load_dotenv()
        self.project_root = Path(os.getcwd())
        self.input_dir = self.project_root / input_base
        self.token_file = self.project_root / token_path
        
        # 구글 드라이브 폴더 매핑 (환경변수나 설정을 통해 확장 가능)
        self.drive_folder_map = {
            "HEALTH": os.getenv("DRIVE_FOLDER_HEALTH", "root"),
            "MONEY": os.getenv("DRIVE_FOLDER_MONEY", "root"),
            "TECH": os.getenv("DRIVE_FOLDER_TECH", "root"),
            "LIFE": os.getenv("DRIVE_FOLDER_LIFE", "root"),
            "MARKETING": os.getenv("DRIVE_FOLDER_MARKETING", "root")
        }

    def _get_drive_service(self):
        """독립적인 구글 드라이브 서비스 빌드"""
        if not self.token_file.exists():
            print(f"⚠️ [DriveSyncer] Token not found at {self.token_file}. Running in local-only mode.")
            return None
        try:
            creds = Credentials.from_authorized_user_file(str(self.token_file))
            return build('drive', 'v3', credentials=creds)
        except Exception as e:
            print(f"❌ [DriveSyncer] Auth Error: {e}")
            return None

    async def sync_to_drive(self, pattern: str = "GOLD_*.json"):
        """입력 디렉토리의 파일을 구글 드라이브로 업로드 및 상태 업데이트"""
        service = self._get_drive_service()
        if not service: return 0
        
        print(f"🚚 [DriveSyncer] Syncing items matching {pattern} to Google Drive...")
        
        sync_count = 0
        if not self.input_dir.exists(): return 0

        # 하위 디렉토리(테마) 순회
        for theme_dir in self.input_dir.iterdir():
            if not theme_dir.is_dir(): continue
            theme_name = theme_dir.name
            
            files_to_sync = [f for f in theme_dir.glob(pattern) if "_SYNCED" not in f.name]
            
            for file_path in files_to_sync:
                print(f"📤 [DriveSyncer] Uploading: {file_path.name}")
                
                if self._upload_file(service, file_path, theme_name):
                    # 성공 시 파일명 변경하여 중복 방지 (배송 완료 라벨링)
                    new_name = file_path.name.replace(".json", "_SYNCED.json")
                    file_path.rename(theme_dir / new_name)
                    sync_count += 1
                    
        print(f"✅ [DriveSyncer] Batch finished. {sync_count} items synced.")
        return sync_count

    def _upload_file(self, service, file_path: Path, theme: str) -> bool:
        """단일 파일 업로드 로직"""
        try:
            parent_id = self.drive_folder_map.get(theme, "root")
            file_metadata = {
                'name': file_path.name,
                'parents': [parent_id] if parent_id != "root" else []
            }
            media = MediaFileUpload(str(file_path), mimetype='application/json', resumable=True)
            service.files().create(body=file_metadata, media_body=media, fields='id').execute()
            return True
        except Exception as e:
            print(f"❌ [DriveSyncer] Upload error for {file_path.name}: {e}")
            return False

if __name__ == "__main__":
    async def test():
        syncer = DriveSyncer()
        await syncer.sync_to_drive()
    asyncio.run(test())
