@echo off
title LinkDropV2 - Launcher
setlocal
chcp 65001 >nul

echo ======================================================
echo    LinkDropV2: Starting Servers
echo ======================================================

:: 1. 좀비 프로세스 정리
echo [1/4] Cleaning zombie processes (3000, 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
echo    - Cleanup complete.

:: 2. 백엔드 기동 (FastAPI)
echo [2/4] Launching Backend (Port 8000)...
start "LinkDrop-Backend" /D "%~dp0apps\api" cmd /k ".venv\Scripts\python.exe -X utf8 main.py"
timeout /t 3 /nobreak >nul

:: 3. 프론트엔드 기동 (Next.js)
echo [3/4] Launching Frontend (Port 3000)...
start "LinkDrop-Frontend" /D "%~dp0apps\web" cmd /k "npm run dev"

:: 4. 웹 서버 대기
echo.
echo    Waiting for servers...
:wait_loop
timeout /t 2 /nobreak >nul
curl -s --max-time 2 http://localhost:3000 -o nul -w "%%{http_code}" 2>nul | findstr "200" >nul
if errorlevel 1 goto wait_loop

echo.
echo ======================================================
echo  SERVERS STARTED!
echo    - Frontend:  http://localhost:3000
echo    - Backend:   http://localhost:8000
echo ======================================================

start http://localhost:3000
timeout /t 3
exit
