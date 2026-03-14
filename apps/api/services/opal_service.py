import os
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional, TypedDict
from pathlib import Path

class OpalSceneStatus(TypedDict):
    scene_id: str
    status: str # 'pending', 'rendering', 'completed', 'failed'
    progress: float
    last_update: str

class OpalProjectState(TypedDict):
    project_id: str
    total_scenes: int
    current_scene_idx: int
    overall_progress: float
    status: str

class OpalNodeMapping:
    """105번 설계도에 따른 데이터-노드 매핑 엔진"""
    @staticmethod
    def map_scene_to_nodes(scene: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "TextNode": {
                "content": scene.get("text", ""),
                "font": "Gmarket Sans",
                "size": "72pt+",
                "background_bar": {"opacity": 0.4, "color": "black"} # 시니어 가독성 바
            },
            "AssetNode": {
                "search_keywords": scene.get("visual", {}).get("keywords", []),
                "match_logic": "Auto-Purity"
            },
            "GradeNode": {
                "mood": scene.get("audio", {}).get("se_config", {}).get("type", "Calm"),
                "lut_theme": "Natural-Contrast"
            },
            "MotionNode": {
                "effect": "Ken-Burns-Zoom", # 완만한 줌인 효과 강제
                "shake_intensity": 0.0 # 흔들림 금지
            },
            "AudioNode": {
                "tts": scene.get("audio", {}).get("tts_voice", ""),
                "se_trigger": scene.get("audio", {}).get("se_config", {}),
                "bgm_volume": 0.0 # 배경음악 완전 제거
            },
            "TimelineNode": {
                "duration": scene.get("duration", 3.5),
                "transition": "Soft-Fade"
            }
        }

import sys
from services.opal_client import opal_client, opal_auth_manager

class OpalService:
    """
    Opal Video Engine Service Layer (Node-Based Architecture)
    - 105번 설계도 규격을 100% 준수하는 오팔 노드 제어 엔진
    """
    def __init__(self):
        self.project_root = Path("C:/LinkDropV2")
        self.state_dir = self.project_root / "packages" / "data" / "04_출고_대기실" / "오팔_상태창"
        self.state_dir.mkdir(parents=True, exist_ok=True)
        self.active_projects: Dict[str, Any] = {}

    async def initialize_project(self, opal_design: Dict[str, Any]) -> str:
        """설계도를 바탕으로 오팔 노드별 정밀 세션 생성"""
        project_id = f"OPL_{datetime.now().strftime('%m%d_%H%M%S')}"
        
        # 105번 규격에 맞춘 노드 매핑 수행
        mapped_scenes = [
            OpalNodeMapping.map_scene_to_nodes(scene) 
            for scene in opal_design.get("scenes", [])
        ]
        
        state = {
            "project_id": project_id,
            "title": opal_design.get("metadata", {}).get("title"),
            "nodes_data": mapped_scenes, # 105번 매핑 완료 데이터
            "status": "ready",
            "overall_progress": 0.0,
            "job_id": None
        }
        
        self.active_projects[project_id] = state
        self._save_state(project_id)
        print(f"📐 [OpalService] Node Mapping Complete for {project_id}")
        return project_id

    async def start_rendering(self, project_id: str):
        """본격적인 씬별 순차 렌더링 시작"""
        if project_id not in self.active_projects: return
        
        state = self.active_projects[project_id]
        state["status"] = "rendering"
        
        print(f"🎬 [OpalService] Rendering Started for {project_id}...")
        
        try:
            # 세션 기반 클라이언트를 통해 실제 오팔 웹 서버에 데이터 투입
            job_id = await opal_client.trigger_render(state["nodes_data"])
            state["job_id"] = job_id
            self._save_state(project_id)
            print(f"🚀 [OpalService] Opal Job Triggered: {job_id}")
        except Exception as e:
            state["status"] = "failed"
            state["error"] = str(e)
            self._save_state(project_id)
            print(f"❌ [OpalService] Rendering Failed: {e}")


    async def intervene_scene(self, project_id: str, scene_id: str, updates: Dict[str, Any]):
        """
        [정교한 개입] 렌더링 중 특정 씬의 파라미터(효과음, 자막 등)를 실시간 수정
        """
        print(f"🛠️ [OpalService] INTERVENTION at {project_id}/{scene_id}: {updates}")
        # 렌더링 큐를 수정하거나 오팔 엔진에 업데이트 명령 전송
        pass

    def get_project_status(self, project_id: str) -> Optional[OpalProjectState]:
        """현재 프로젝트의 실시간 상태 반환"""
        return self.active_projects.get(project_id)

    def get_session_info(self) -> Dict[str, Any]:
        """통합 세션 브릿지를 통해 현재 구글 쿠키 및 상태 조회"""
        profile = opal_auth_manager.load_tokens()
        if profile and profile.cookies:
            return {
                "status": "connected",
                "last_sync": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "account": profile.cookies.get("HSID", "Google Account Locked"),
                "cookies": profile.cookies
            }
        return {
            "status": "disconnected",
            "last_sync": None,
            "cookies": None
        }

    def trigger_login(self) -> bool:
        """[이감독님 제안] 독립적인 오팔 전용 브릿지 창을 띄움"""
        try:
            import subprocess
            script_path = "C:/LinkDropV2/packages/tools/skill-3-opalvideo/opal-access/scripts/login.py"
            # 노트북LM과는 완전히 독립된 별도의 프로세스 실행
            subprocess.Popen([sys.executable, script_path], 
                             cwd="C:/LinkDropV2", 
                             creationflags=subprocess.CREATE_NEW_CONSOLE)
            return True
        except Exception as e:
            print(f"❌ Opal Login Trigger Error: {e}")
            return False

opal_service = OpalService()
