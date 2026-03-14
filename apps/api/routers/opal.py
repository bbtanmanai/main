from fastapi import APIRouter, HTTPException
from services.opal_service import opal_service

router = APIRouter(prefix="/api/v1/opal", tags=["Opal"])

@router.get("/status")
async def get_opal_status():
    info = opal_service.get_session_info()
    return {"status": info["status"], "last_sync": info["last_sync"]}

@router.get("/session-info")
async def get_opal_session_info():
    return opal_service.get_session_info()

@router.post("/login-trigger")
async def trigger_opal_login_bridge():
    success = opal_service.trigger_login()
    return {"success": success, "message": "Opal(Google) login bridge triggered."}
