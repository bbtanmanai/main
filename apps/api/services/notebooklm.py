import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

# 드디어 라이브러리 직접 임포트 가능 (Python 3.11)
try:
    import notebooklm_tools
    from notebooklm_tools.cli.utils import get_client
    from notebooklm_tools.services import notebooks as notebooks_service
    LIB_AVAILABLE = True
    print("DEBUG: NotebookLM Library loaded successfully.")
except ImportError as e:
    LIB_AVAILABLE = False
    print(f"DEBUG: Library load failed: {str(e)}")

class NotebookLMAdminService:
    def __init__(self):
        # 윈도우 환경 최적화된 절대 경로
        self.profile_path = Path(r"C:\Users\User\.notebooklm-mcp-cli\profiles\default\metadata.json")
        self.project_root = Path(__file__).resolve().parents[3]
        self.data_refined_dir = self.project_root / "packages" / "data" / "refined"

    def get_session_status(self) -> Dict[str, Any]:
        """현재 세션 상태 및 프로필 정보 반환"""
        if not self.profile_path.exists():
            return {"status": "disconnected", "message": "Login required.", "account": None}
        
        try:
            with open(self.profile_path, 'r', encoding='utf-8') as f:
                profile_data = json.load(f)
            
            account = profile_data.get("email", "Unknown Account")
            
            # 라이브러리 직접 호출로 실제 연결 상태 확인
            if LIB_AVAILABLE:
                try:
                    with get_client() as client:
                        client.list_notebooks()
                    return {"status": "connected", "message": "Connected (Direct)", "account": account}
                except Exception:
                    return {"status": "expired", "message": "Session expired.", "account": account}
            
            return {"status": "connected", "message": "Connected (Legacy)", "account": account}
        except Exception as e:
            return {"status": "error", "message": str(e), "account": None}

    def get_inventory(self) -> Dict[str, Any]:
        """전체 노트북 목록 반환 (Direct Import 방식)"""
        if not LIB_AVAILABLE:
            return {"error": "Library not available."}
        
        try:
            with get_client() as client:
                notebooks = client.list_notebooks()
                return {"notebooks": notebooks}
        except Exception as e:
            return {"error": f"Direct fetch failed: {str(e)}"}

    def get_sources(self, notebook_id: str) -> List[Dict[str, Any]]:
        """특정 노트북의 소스 목록 반환"""
        if not LIB_AVAILABLE: return []
        try:
            with get_client() as client:
                return client.get_notebook_sources_with_types(notebook_id)
        except Exception:
            return []

    def check_data_integrity(self, notebook_id: str) -> Dict[str, Any]:
        """로컬 refined 데이터와 노트북 소스 대조"""
        local_files = [p.name for p in self.data_refined_dir.rglob("*.json")] if self.data_refined_dir.exists() else []
        remote_sources = self.get_sources(notebook_id)
        remote_names = [s['title'] for s in remote_sources]
        
        missing = [f for f in local_files if f not in remote_names]
        synced = [f for f in local_files if f in remote_names]
        
        return {
            "total_local": len(local_files),
            "synced_count": len(synced),
            "missing_count": len(missing),
            "missing_files": missing,
            "synced_files": synced
        }

    def trigger_login(self) -> bool:
        """nlm_login.bat 실행"""
        import subprocess
        try:
            bat_path = self.project_root / "nlm_login.bat"
            if bat_path.exists():
                subprocess.Popen(["cmd", "/c", "start", str(bat_path)])
                return True
            return False
        except Exception:
            return False

notebook_admin_service = NotebookLMAdminService()
