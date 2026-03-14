import os
import json
import uuid
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
from playwright.async_api import async_playwright
from core.config import settings

class WebSaverAgent:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent.parent
        self.web_save_dir = self.project_root / "packages" / "data" / "web_bundles"
        self.web_save_dir.mkdir(parents=True, exist_ok=True)

    async def save_full_page(self, url: str) -> Dict[str, Any]:
        """웹페이지의 텍스트, 이미지, 영상 소스를 렌더링 후 저장"""
        print(f"🌐 High-Fidelity Scraping started: {url}")
        
        bundle_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        bundle_path = self.web_save_dir / f"{timestamp}_{bundle_id}"
        bundle_path.mkdir(exist_ok=True)

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            
            try:
                # 페이지 로드 (네트워크 대기)
                await page.goto(url, wait_until="networkidle", timeout=60000)
                
                # 1. 텍스트 및 기본 정보 추출
                title = await page.title()
                content = await page.inner_text("body")
                
                # 2. 이미지 소스 추출
                images = await page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('img'))
                        .map(img => img.src)
                        .filter(src => src.startsWith('http'));
                }""")
                
                # 3. 영상 소스 추출 (video 태그 및 iframe)
                videos = await page.evaluate("""() => {
                    const videoTags = Array.from(document.querySelectorAll('video source, video'))
                        .map(v => v.src || v.currentSrc)
                        .filter(src => src);
                    const iframes = Array.from(document.querySelectorAll('iframe'))
                        .map(f => f.src)
                        .filter(src => src.includes('youtube') || src.includes('vimeo'));
                    return [...new Set([...videoTags, ...iframes])];
                }""")

                # 4. 자산 번들 저장 (JSON)
                bundle_data = {
                    "id": bundle_id,
                    "url": url,
                    "title": title,
                    "content": content,
                    "assets": {
                        "images": images[:20], # 상위 20개만 우선 확보
                        "videos": videos
                    },
                    "collected_at": datetime.now().isoformat(),
                    "bundle_path": str(bundle_path)
                }

                file_path = bundle_path / "index.json"
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(bundle_data, f, ensure_ascii=False, indent=2)

                print(f"✅ Bundle created: {bundle_path.name} (Images: {len(images)}, Videos: {len(videos)})")
                await browser.close()
                return bundle_data

            except Exception as e:
                print(f"❌ Scraping Failed: {str(e)}")
                await browser.close()
                raise e

web_saver_agent = WebSaverAgent()
