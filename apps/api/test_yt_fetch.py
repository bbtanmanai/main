import asyncio
import os
import sys
from pathlib import Path

# 프로젝트 루트 및 API 경로 강제 설정
API_DIR = Path("C:/LinkDropV2/apps/api")
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

# 이제 services.agents... 형식으로 임포트 가능
from services.agents.agent_0_source_fetcher import source_fetcher_agent

async def test_youtube_fetch():
    print("🚀 [YouTube Test] Starting High-Purity Video Extraction...")
    url = "https://www.youtube.com/watch?v=Sc6Me_Z6idQ"
    
    try:
        result = await source_fetcher_agent.fetch_youtube_video(url, theme="Video_Wisdom")
        print(f"✅ Success! YouTube knowledge ingested.")
        print(f"   - Title: {result['title']}")
        print(f"   - Content Snippet: {result['content'][:100]}...")
    except Exception as e:
        print(f"❌ Error during YouTube fetch: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_youtube_fetch())
