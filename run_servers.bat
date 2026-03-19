@echo off
title LinkDropV2 - Integrated Launcher (v1.2)
setlocal
chcp 65001 >nul

echo ======================================================
echo    LinkDropV2: Initializing Environment
echo ======================================================

:: 1. 좀비 프로세스 강제 정리
echo [1/5] Cleaning zombie processes (3000, 7788, 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :7788 ^| findstr LISTENING') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
taskkill /F /IM electron.exe /T >nul 2>&1
echo    - System cleanup complete.

:: 2. Next.js 캐시 정리
echo [2/5] Cleaning Next.js cache...
if exist "apps\web\.next\cache" (
    rmdir /s /q "apps\web\.next\cache"
)

:: 3. 백엔드 기동 (FastAPI)
echo [3/5] Launching Backend Engine (Port 8000)...
cd /d "%~dp0apps\api"
start "LinkDrop-Backend" /min cmd /k "set PYTHONUTF8=1 && .venv\Scripts\python.exe main.py"
cd /d "%~dp0"
timeout /t 3 /nobreak >nul

:: 4. 프론트엔드 기동 (Next.js)
echo [4/5] Launching Frontend (Port 3000)...
cd /d "%~dp0apps\web"
start "LinkDrop-Frontend" /min cmd /k "npm run dev"
cd /d "%~dp0"

:: 5. 데스크톱 앱 기동 (Electron + Pipeline Server 7788)
echo [5/5] Launching Desktop App (Port 7788)...
timeout /t 2 /nobreak >nul
cd /d "%~dp0apps\desktop"
start "LinkDrop-Desktop" /min cmd /k "npm start"
cd /d "%~dp0"

:: 웹 서버 대기
echo.
echo    Waiting for servers...
:wait_loop
timeout /t 2 /nobreak >nul
curl -s --max-time 2 http://localhost:3000 -o nul -w "%%{http_code}" 2>nul | findstr "200" >nul
if errorlevel 1 goto wait_loop

:: 완료
echo.
echo ======================================================
echo  SERVERS STARTED!
echo    - Frontend:  http://localhost:3000
echo    - Backend:   http://localhost:8000
echo    - Desktop:   http://localhost:7788
echo ======================================================

start http://localhost:3000/content/longform
timeout /t 3
exit
