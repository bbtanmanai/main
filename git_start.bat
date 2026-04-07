@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"

echo ========================================
echo  LinkDrop V2 — 최신 코드 받기
echo ========================================
echo.

git pull origin develop

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [오류] 업데이트 중 문제가 발생했습니다.
    pause
    exit /b 1
)

echo.
echo [완료] 최신 코드를 받았습니다.
pause
