from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi_mcp import FastApiMCP
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uvicorn
import uuid
import os
from datetime import datetime
from pathlib import Path
import json

# Core & DB Imports
from core.config import settings
from core.database import supabase

# Service Layer Imports
from services.inventory import get_inventory_summary, get_pipeline_flow_data
from services.orchestrator import orchestrator
from services.notebooklm import notebook_admin_service

# --- Initialization ---
app = FastAPI(
    title="LinkDropV2 Core Engine",
    description="Integrated AI Workflow Backend (Python 3.11 + MCP)",
    version="1.1.1-STABLE"
)

# MCP Initialization
mcp = FastApiMCP(
    app,
    name="LinkDropV2 MCP",
    description="Integrated MCP server for LinkDropV2 AI workflow",
)

# --- Startup Event ---
@app.on_event("startup")
async def startup_event():
    print(">>> [BOOT] LinkDropV2 Engine Initializing...")
    
    # 기초 공정 자동화 엔진 가동 (상시 축적 모드)
    await orchestrator.start_auto_pilot()
    print(">>> [BOOT] Foundation Heartbeat Started (Auto-Accumulation ON)")
    
    print(">>> [BOOT] LinkDropV2 Engine Ready (v1.1.1)")

# --- CORS Settings ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Base Endpoints ---

@app.get("/", tags=["System"], operation_id="check_health")
async def health_check():
    return {
        "status": "online",
        "engine": "FastAPI (Python 3.11)",
        "version": "1.1.0",
        "mcp": "enabled"
    }

# --- Inventory & Pipeline API ---

@app.get("/api/v1/inventory/summary", tags=["Inventory"], operation_id="get_inventory_summary")
async def fetch_inventory_summary():
    return get_inventory_summary()

@app.get("/api/v1/inventory/pipeline-status", tags=["Inventory"], operation_id="get_pipeline_status")
async def fetch_pipeline_status():
    return get_pipeline_flow_data()

# --- NotebookLM Control API ---

@app.get("/api/v1/notebooklm/status", tags=["NotebookLM"], operation_id="get_notebooklm_status")
async def get_notebooklm_status():
    return notebook_admin_service.get_session_status()

@app.get("/api/v1/notebooklm/inventory", tags=["NotebookLM"], operation_id="get_notebook_list")
async def get_notebooklm_inventory():
    return notebook_admin_service.get_inventory()

@app.get("/api/v1/notebooklm/integrity/{notebook_id}", tags=["NotebookLM"], operation_id="check_notebook_integrity")
async def check_notebooklm_integrity(notebook_id: str):
    return notebook_admin_service.check_data_integrity(notebook_id)

@app.post("/api/v1/notebooklm/login-trigger", tags=["NotebookLM"], operation_id="trigger_notebook_login")
async def trigger_notebook_login():
    success = notebook_admin_service.trigger_login()
    return {"success": success, "message": "Login bridge triggered."}

# --- Content & Knowledge API ---

@app.get("/api/v1/contents/tags", tags=["Contents"])
async def get_real_tags():
    """지식 서랍장에서 실제 테마(태그) 목록 추출"""
    gold_dir = Path("C:/LinkDropV2/packages/data/02_지식_서랍장")
    if not gold_dir.exists(): return []
    
    themes = set()
    for file in gold_dir.rglob("GOLD_*.json"):
        try:
            with open(file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'theme' in data: themes.add(data['theme'])
        except: continue
    return sorted(list(themes))

@app.get("/api/v1/contents/script-by-tag/{tag}", tags=["Contents"])
async def get_script_by_tag(tag: str):
    """특정 태그에 해당하는 가장 최신 대본 가져오기"""
    gold_dir = Path("C:/LinkDropV2/packages/data/02_지식_서랍장")
    target_script = None
    latest_time = 0
    
    for file in gold_dir.rglob("GOLD_*.json"):
        try:
            with open(file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if data.get('theme') == tag:
                    mtime = file.stat().st_mtime
                    if mtime > latest_time:
                        latest_time = mtime
                        target_script = {
                            "title": data.get("title", tag),
                            "content": data.get("content", data.get("summary", ""))
                        }
        except: continue
    
    if target_script: return target_script
    raise HTTPException(status_code=404, detail="Script not found for this tag.")

# --- Orchestrator & Agents API ---

@app.get("/api/v1/orchestrator/skills", tags=["Agents"], operation_id="list_installed_skills")
async def list_installed_skills():
    """packages/tools/ 디렉토리의 모든 독립 스킬 정보를 스캔하여 반환"""
    try:
        project_root = Path(__file__).parent.parent.parent  # C:/LinkDropV2
        tools_dir = project_root / "packages" / "tools"

        if not tools_dir.exists():
            return []

        skills = []
        for skill_dir in tools_dir.glob("skill-*"):
            if not skill_dir.is_dir():
                continue
            manifest_path = skill_dir / "manifest.json"
            if manifest_path.exists():
                try:
                    with open(manifest_path, 'r', encoding='utf-8') as f:
                        skills.append(json.load(f))
                except Exception:
                    pass

        return sorted(skills, key=lambda x: (x.get("category", 0), x.get("label_number", "99")))
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@app.get("/api/v1/orchestrator/status", tags=["Agents"], operation_id="get_orchestrator_status")
async def get_orchestrator_status():
    return {**orchestrator.state, "agent_states": orchestrator.agent_states}

@app.post("/api/v1/orchestrator/run", tags=["Agents"], operation_id="trigger_full_pipeline")
async def trigger_pipeline(background_tasks: BackgroundTasks, keyword: str = "시니어 수익화"):
    background_tasks.add_task(orchestrator.run_full_pipeline, keyword)
    return {"success": True, "message": f"Pipeline started for: {keyword}"}

# --- Design Asset Bridge ---
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

design_assets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../design_inbox/front_assets/front_design"))
app.mount("/api/v1/assets/view", StaticFiles(directory=design_assets_dir), name="design-view")

@app.get("/api/v1/assets/design/{moban_id}/thumbnail", tags=["Assets"], operation_id="get_design_thumbnail")
async def get_design_thumbnail(moban_id: str):
    clean_id = "".join(filter(str.isdigit, moban_id))
    file_path = f"../../design_inbox/front_assets/front_design/moban{clean_id}/{clean_id}.png"
    abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), file_path))
    if os.path.exists(abs_path): return FileResponse(abs_path)
    raise HTTPException(status_code=404, detail="Thumbnail not found.")

# Mount MCP
mcp.mount_sse()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
