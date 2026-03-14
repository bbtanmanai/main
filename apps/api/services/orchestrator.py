import asyncio
import importlib.util
import os
import json
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

# 독립 스킬 패키지를 참조할 수 있도록 sys.path 추가
PROJECT_ROOT = Path("C:/LinkDropV2")
TOOLS_PATH = PROJECT_ROOT / "packages" / "tools"
if str(TOOLS_PATH) not in sys.path:
    sys.path.insert(0, str(TOOLS_PATH))

def _load_skill(folder_name: str, class_name: str):
    """하이픈 포함 스킬 폴더를 importlib로 동적 로드."""
    skill_path = TOOLS_PATH / folder_name / "logic.py"
    if not skill_path.exists():
        raise FileNotFoundError(f"Skill not found: {skill_path}")

    spec = importlib.util.spec_from_file_location(folder_name, str(skill_path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return getattr(module, class_name)

class FoundationEngine:
    """
    LinkDrop V2: 기초 공정 자동화 엔진 (The Heartbeat)
    - 독립 스킬(Skill-01~06)을 순차적으로 조율하여 지식 축적 가동
    """
    def __init__(self):
        self.ledger_path = PROJECT_ROOT / "packages" / "data" / "foundation_ledger.json"
        self.state = {
            "status": "initializing",
            "last_cycle_time": None,
            "total_accumulated": 0,
            "current_task": "Idle"
        }
        self._ensure_ledger()

    def _ensure_ledger(self):
        if not self.ledger_path.exists():
            self.ledger_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.ledger_path, 'w', encoding='utf-8') as f:
                json.dump({"processed_ids": [], "sync_history": []}, f)

    # --- 독립 스킬 동적 로딩 (Lazy Loading) ---
    def get_skill_instance(self, skill_id: str):
        """독립 스킬 폴더의 logic.py에서 인스턴스를 동적으로 생성."""
        skill_map = {
            "0_fetcher":  ("skill-0-vault-source-fetcher", "VaultSourceFetcher"),
            "1_refiner":  ("skill-1-source-refiner",       "KnowledgeRefiner"),
            "3_syncer":   ("skill-3-drive-syncer",         "DriveSyncer"),
        }
        if skill_id not in skill_map:
            return None
        folder, class_name = skill_map[skill_id]
        try:
            cls = _load_skill(folder, class_name)
            return cls()
        except Exception as e:
            print(f"[Foundation] Failed to load skill {skill_id}: {e}")
            return None

    async def run_forever(self):
        """[핵심] 기초 공정 무한 루프 가동 (4시간 주기)"""
        print("[Foundation] ALWAYS-ON Engine Started with Independent Skills.")
        while True:
            try:
                await self.execute_full_cycle()
            except Exception as e:
                print(f"[Foundation] Cycle Error: {str(e)}. Retrying in 10 mins...")
                await asyncio.sleep(600)
            
            print("[Foundation] Cycle Finished. Sleeping for 4 hours...")
            await asyncio.sleep(4 * 3600)

    async def execute_full_cycle(self):
        """독립 스킬들을 순차적으로 실행 (수집 -> 정제 -> 배송)"""
        self.state["status"] = "running"
        self.state["last_cycle_time"] = datetime.now().isoformat()
        
        # 1. 수집 (No.01)
        self.state["current_task"] = "Collecting"
        skill_id = "skill-0-vault-source-fetcher"
        orchestrator.update_agent(skill_id, "working")
        
        fetcher = self.get_skill_instance("0_fetcher")
        if fetcher:
            print(f"[Foundation] Step 1: Gathering materials ({skill_id})...")
            await fetcher.fetch_vault_updates(limit_per_theme=2)
            orchestrator.update_agent(skill_id, "completed")
        else:
            orchestrator.update_agent(skill_id, "error")
        
        # 2. 정제 (No.02)
        self.state["current_task"] = "Refining"
        skill_id = "skill-1-source-refiner"
        orchestrator.update_agent(skill_id, "working")
        
        refiner = self.get_skill_instance("1_refiner")
        if refiner:
            print(f"[Foundation] Step 2: Refining knowledge ({skill_id})...")
            await refiner.run_refinement()
            orchestrator.update_agent(skill_id, "completed")
        else:
            orchestrator.update_agent(skill_id, "error")
        
        # 3. 배송 (No.06)
        self.state["current_task"] = "Syncing"
        skill_id = "skill-3-drive-syncer"
        orchestrator.update_agent(skill_id, "working")
        
        syncer = self.get_skill_instance("3_syncer")
        if syncer:
            print(f"[Foundation] Step 3: Syncing to G-Drive ({skill_id})...")
            synced_count = await syncer.sync_to_drive()
            self.state["total_accumulated"] += synced_count
            orchestrator.update_agent(skill_id, "completed")
        else:
            orchestrator.update_agent(skill_id, "error")
        
        self.state["status"] = "idle"
        self.state["current_task"] = "Waiting"
        print("[Foundation] Independent Cycle Complete.")

foundation_engine = FoundationEngine()

class ContentOrchestrator:
    """UI 대응 및 전체 파이프라인 조율자"""
    def __init__(self):
        self.state = {"status": "idle", "last_run": None, "current_step": "None"}
        self.agent_states = {}

    async def start_auto_pilot(self):
        asyncio.create_task(foundation_engine.run_forever())

    def update_agent(self, agent_id: str, status: str):
        self.agent_states[agent_id] = status

    async def run_full_pipeline(self, keyword: str = "시니어 수익화"):
        return await foundation_engine.execute_full_cycle()

orchestrator = ContentOrchestrator()
