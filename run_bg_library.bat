@echo off
chcp 65001 > nul
title FLUX 배경 라이브러리 생성 (3,400장)
echo.
echo ========================================
echo  FLUX Schnell 배경 이미지 라이브러리
echo  17화풍 x 200장 = 3,400장
echo  예상 비용: $10.20
echo  예상 시간: 4~5시간
echo ========================================
echo.

cd /d C:\LinkDropV2
apps\api\.venv\Scripts\python.exe -X utf8 -u ^
  packages\tools\skill-2-video-longform1\opal-manager\generate_bg_library.py ^
  --resume ^
  2>&1 | tee tmp\bg_library_gen.log

echo.
echo [완료] 로그: tmp\bg_library_gen.log
pause
