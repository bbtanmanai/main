@echo off
title LinkDropV2 - Stable Integrated Launcher (v1.1.1-3.11)
setlocal

echo ======================================================
echo    LinkDropV2: Initializing Stable Environment (3.11)
echo ======================================================

:: 1. 좀비 프로세스 및 유령 서버 강제 정리 (트리 종료 적용)
echo [1/4] Cleaning zombie processes (3000, 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
taskkill /F /IM python.exe /T >nul 2>&1
echo    - System cleanup complete.

:: 2. Next.js 캐시 정리 (안정적인 리로딩을 위해)
echo [2/4] Verifying dependencies & Cleaning cache...
if exist "apps\web\.next" (
    rmdir /s /q "apps\web\.next"
)

:: 3. 백엔드 기동 (Python 3.11 MCP Engine)
echo [3/4] Launching Backend Engine (Port 8000)...
cd /d "%~dp0apps\api"
start "LinkDrop-Backend" cmd /k "set PYTHONUTF8=1 && .venv\Scripts\python.exe main.py"
echo    - Waiting for backend stabilization...
timeout /t 5 /nobreak > nul

:: 4. 프론트엔드 기동 (Next.js Interface)
echo [4/4] Launching Frontend Interface (Port 3000)...
cd /d "%~dp0apps\web"
start "LinkDrop-Frontend" cmd /k "npm run dev"

echo.
echo ------------------------------------------------------
echo ✅ SERVERS STARTED! (3.11 Integrated Mode)
echo    - Frontend: http://localhost:3000/admin/agent-control
echo    - Backend:  http://localhost:8000
echo    - MCP SSE:  http://localhost:8000/mcp/sse
echo ------------------------------------------------------
timeout /t 5
exit
