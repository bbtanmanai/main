import json
import os
from pathlib import Path
from typing import Optional, Dict, Any

class OpalAuthManager:
    """
    [독립형] 노트북LM과 완벽히 분리된 오팔 전용 인증 관리자.
    노트북LM의 코드를 전혀 수정하지 않으며, 오팔만의 세션 데이터를 관리합니다.
    """
    def __init__(self):
        self.storage_dir = Path.home() / ".linkdrop-opal"
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.auth_file = self.storage_dir / "auth.json"

    def load_tokens(self) -> Optional[Dict[str, Any]]:
        """오팔 전용 세션 파일에서 쿠키 로드"""
        if not self.auth_file.exists():
            return None
        try:
            with open(self.auth_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "cookies" in data:
                    # 노트북LM과 겹치지 않는 독립적인 객체 반환
                    return data
            return None
        except Exception:
            return None

    def save_tokens(self, cookies: dict):
        """오팔 전용 세션 저장"""
        import time
        data = {
            "cookies": cookies,
            "extracted_at": time.time()
        }
        with open(self.auth_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def is_authenticated(self) -> bool:
        return self.load_tokens() is not None

opal_auth_manager = OpalAuthManager()
