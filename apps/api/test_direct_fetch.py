import asyncio
import os
import sys
from pathlib import Path

# Add apps/api to sys.path
api_dir = Path("C:/LinkDropV2/apps/api")
sys.path.append(str(api_dir))

from services.agents.source_fetcher import source_fetcher_agent

async def test_fetch():
    print("🚀 [Direct Test] Starting High-Purity Fetch...")
    keyword = "시니어 부업"
    # RSS URL 직접 생성 테스트
    rss_url = f"https://news.google.com/rss/search?q={keyword}"
    
    try:
        results = await source_fetcher_agent.fetch_from_rss(rss_url, theme="Video_Wisdom")
        print(f"✅ Success! Collected {len(results)} items.")
        for r in results[:2]:
            print(f"   - Title: {r['title']}")
    except Exception as e:
        print(f"❌ Error during fetch: {e}")

if __name__ == "__main__":
    asyncio.run(test_fetch())
