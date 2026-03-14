import os
import json
import time
import asyncio
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from openai import OpenAI
from dotenv import load_dotenv

class SystemMonitor:
    """
    [Skill-4-07] 시스템 감시 에이전트 (독립형)
    - 세션 대화 로그를 실시간 감시하여 10분 이상 활동이 없을 시 요약 및 패치 생성
    - 매일 밤 11시 59분에 일일 로그를 아카이빙하여 문서 유지
    """
    def __init__(self, 
                 log_path: str = "packages/data/logs/session_chat.log",
                 archive_base: str = "docs/archives"):
        load_dotenv()
        self.project_root = Path(os.getcwd())
        self.log_file = self.project_root / log_path
        self.archive_dir = self.project_root / archive_base
        self.archive_dir.mkdir(parents=True, exist_ok=True)
        
        self.last_summarized_mtime = 0
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("⚠️ [SystemMonitor] OPENAI_API_KEY not found. Auto-summary disabled.")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)

    async def run_monitoring_loop(self):
        print("🕵️ [SystemMonitor] Monitoring Sequence Initiated (Idle Detection & Nightly Archiving)")
        while True:
            now = datetime.now()
            
            # 1. 일일 로그 아카이빙 (밤 11시 59분 체크)
            if now.hour == 23 and now.minute == 59:
                await self.archive_daily_log()
                await asyncio.sleep(65) # 중복 아카이브 방지 (1분 이상 대기)
            
            # 2. 10분간 침묵(Inactivity) 감지 시 세션 요약 및 문서 패치 제안
            if self.log_file.exists():
                mtime = os.path.getmtime(self.log_file)
                idle_seconds = time.time() - mtime
                
                # 10분(600초) 이상 수정이 없고, 마지막 요약 시점보다 파일이 갱신되었을 때
                if idle_seconds > 600 and mtime > self.last_summarized_mtime:
                    print("🤫 [SystemMonitor] 10-minute silence detected. Initiating auto-summary...")
                    await self.generate_patch_suggestion()
                    self.last_summarized_mtime = mtime
            
            await asyncio.sleep(60) # 1분 간격 체크

    async def generate_patch_suggestion(self):
        """대화 로그 분석을 통한 자동 문서화 제안"""
        if not self.client: return
        
        try:
            with open(self.log_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if len(content) < 200: return # 너무 짧은 로그는 패스

            print("📝 [SystemMonitor] Analyzing session for auto-patch...")
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "당신은 AI 기록 전령입니다. 최근의 대화 로그를 요약하여 프로젝트의 규칙이나 공정 문서에 반영할 내용을 제정리하세요."},
                    {"role": "user", "content": f"최근 대화 로그 (마지막 5000자):\n{content[-5000:]}\n\n위 대화에서 논의된 '새로운 표준', '공정 우선순위', '변경 사항'을 요약하여 Markdown 형식으로 작성하세요."}
                ]
            )
            summary = response.choices[0].message.content
            
            patch_name = f"PATCH_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            with open(self.archive_dir / patch_name, 'w', encoding='utf-8') as f:
                f.write(f"# 🛠️ 자동 세션 요약 및 패치 제안\n\n{summary}")
            
            print(f"✅ [SystemMonitor] Auto-patch suggestion created: {patch_name}")
        except Exception as e:
            print(f"❌ [SystemMonitor] Auto-update failed: {e}")

    async def archive_daily_log(self):
        """일일 대화 내용을 아카이브 폴더로 이동"""
        try:
            if not self.log_file.exists() or os.path.getsize(self.log_file) == 0:
                return
            
            date_str = datetime.now().strftime("%Y-%m-%d")
            archive_path = self.archive_dir / f"{date_str}_Daily_Report.md"
            
            # 로그 파일 복사 및 기존 로그 초기화
            shutil.copy(str(self.log_file), str(archive_path))
            with open(self.log_file, 'w', encoding='utf-8') as f:
                f.write(f"# [Session Start] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                
            print(f"📦 [SystemMonitor] Daily Archive Successful: {archive_path.name}")
        except Exception as e:
            print(f"❌ [SystemMonitor] Archiving failed: {e}")

if __name__ == "__main__":
    async def test():
        monitor = SystemMonitor()
        # 테스트를 위해 즉시 패치 생성 시도 (데이터가 있을 시)
        await monitor.generate_patch_suggestion()
        print("Test cycle complete.")
    asyncio.run(test())
