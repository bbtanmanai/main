@echo off
chcp 65001 >nul
echo.
echo ========================================
echo  Opal AppCatalyst 토큰 캡처 도구
echo ========================================
echo.

REM Chrome이 이미 CDP 포트로 열려있는지 확인
python -c "import httpx; r=httpx.get('http://localhost:9222/json',timeout=3); print('CDP OK')" 2>nul
if %errorlevel% neq 0 (
    echo [1단계] Chrome을 CDP 모드로 시작합니다...
    echo.
    REM Chrome 실행 경로 탐색
    set CHROME=""
    if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
        set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
    )
    if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
        set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    )

    if %CHROME%=="" (
        echo [오류] Chrome을 찾을 수 없습니다.
        echo 수동으로 Chrome을 --remote-debugging-port=9222 옵션으로 실행하세요.
        pause
        exit /b 1
    )

    echo Chrome 시작 중: %CHROME%
    start "" %CHROME% --remote-debugging-port=9222 --user-data-dir="%TEMP%\opal_cdp_profile" "https://opal.google/edit/1Mocymk_VJV162306I-lg0Z8QkRJF3N0U"
    echo.
    echo Chrome이 열리면 Opal 앱이 로드될 때까지 기다리세요.
    timeout /t 5 /nobreak >nul
) else (
    echo [확인] Chrome CDP 포트 9222 이미 열려있음
)

echo.
echo [2단계] Opal에서 한 번 생성 버튼을 클릭하거나 페이지를 새로고침 하세요.
echo        AppCatalyst 요청이 감지되면 자동으로 토큰이 저장됩니다.
echo.
echo 토큰 캡처 시작 (최대 60초 대기)...
echo.

python -B -X utf8 capture_token_cdp.py

echo.
pause
