import os
import json
import uuid
import feedparser
import trafilatura
import asyncio
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import urllib.parse

class VaultSourceFetcher:
    """
    [Skill-0-01] 콘텐츠 소재탐사 에이전트 (독립형)
    - 5대 핵심 Vault 기반 지능형 웹 콘텐츠 수집 엔진
    - 외부 의존성 없이 독립적으로 실행 가능
    """
    def __init__(self, output_base: str = "packages/data/01_재료_하차장"):
        self.project_root = Path(os.getcwd())
        self.raw_data_dir = self.project_root / output_base
        self.raw_data_dir.mkdir(parents=True, exist_ok=True)
        
        # 5대 핵심 테마 정의 (NotebookLM Vault 기반)
        self.vault_themes = {
            "HEALTH": "시니어 건강 운동 습관",
            "MONEY": "지식 수익화 창업 부수입",
            "TECH": "AI 트렌드 IT 실무",
            "LIFE": "자기계발 인생 조언 지혜",
            "MARKETING": "SNS 마케팅 콘텐츠 제작"
        }

    async def fetch_vault_updates(self, limit_per_theme: int = 2) -> List[Dict[str, Any]]:
        """5대 Vault 테마별로 RSS 기반 웹 본문 추출 및 저장"""
        results = []
        for theme_id, keyword in self.vault_themes.items():
            rss_url = f"https://news.google.com/rss/search?q={urllib.parse.quote(keyword)}"
            theme_data = await self._fetch_from_rss(rss_url, theme_id, limit_per_theme)
            results.extend(theme_data)
        return results

    async def _fetch_from_rss(self, rss_url: str, theme_id: str, limit: int) -> List[Dict[str, Any]]:
        feed = feedparser.parse(rss_url)
        collected = []
        
        for entry in feed.entries[:limit]:
            link = getattr(entry, 'link', '')
            downloaded = trafilatura.fetch_url(link)
            content = trafilatura.extract(downloaded) if downloaded else ""
            
            if content and len(content) > 300: # 의미 있는 본문만 수집
                source_data = {
                    "id": str(uuid.uuid4()),
                    "theme": theme_id,
                    "title": getattr(entry, 'title', 'No Title'),
                    "url": link,
                    "content": content,
                    "collected_at": datetime.now().isoformat(),
                    "source_type": "RSS_VAULT_UPDATE"
                }
                self._save_to_staging(source_data)
                collected.append(source_data)
        return collected

    def _save_to_staging(self, data: Dict[str, Any]):
        """테마별 폴더에 JSON 파일로 독립 저장"""
        save_dir = self.raw_data_dir / data['theme']
        save_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = save_dir / f"RAW_{data['id'][:8]}.json"
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    # 독립 테스트 실행
    async def test():
        fetcher = VaultSourceFetcher()
        res = await fetcher.fetch_vault_updates(limit_per_theme=1)
        print(f"✅ {len(res)} materials collected.")
    asyncio.run(test())
