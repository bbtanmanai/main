import os
import json
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from youtube_transcript_api import YouTubeTranscriptApi
from googleapiclient.discovery import build
from core.config import settings
from core.database import supabase

class YoutubeFetcherAgent:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent.parent
        self.raw_data_dir = self.project_root / "packages" / "data" / "raw" / "YOUTUBE"
        self.raw_data_dir.mkdir(parents=True, exist_ok=True)
        self.youtube_api_key = settings.YOUTUBE_API_KEY

    def _extract_video_id(self, url: str) -> Optional[str]:
        """유튜브 URL에서 비디오 ID 추출"""
        patterns = [
            r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
            r'youtu\.be\/([0-9A-Za-z_-]{11})',
            r'shorts\/([0-9A-Za-z_-]{11})'
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    async def fetch_transcript(self, video_id: str) -> str:
        """비디오 ID로부터 자막 추출 (한국어 우선, 차선 영어)"""
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            
            # 한국어 자막 시도
            try:
                transcript = transcript_list.find_transcript(['ko'])
            except:
                # 영어 자막 시도
                try:
                    transcript = transcript_list.find_transcript(['en'])
                except:
                    # 자동 번역이라도 시도
                    transcript = transcript_list.find_generated_transcript(['ko', 'en'])
            
            data = transcript.fetch()
            return " ".join([item['text'] for item in data])
        except Exception as e:
            print(f"⚠️ Transcript Error for {video_id}: {str(e)}")
            return ""

    async def get_video_metadata(self, video_id: str) -> Dict[str, Any]:
        """유튜브 API를 통한 영상 메타데이터 확보"""
        if not self.youtube_api_key:
            return {"title": f"Video_{video_id}", "description": ""}
            
        try:
            youtube = build('youtube', 'v3', developerKey=self.youtube_api_key)
            request = youtube.videos().list(part="snippet,statistics", id=video_id)
            response = request.execute()
            
            if not response['items']:
                return {"title": "Unknown", "description": ""}
                
            snippet = response['items'][0]['snippet']
            return {
                "title": snippet['title'],
                "description": snippet['description'],
                "channel": snippet['channelTitle'],
                "published_at": snippet['publishedAt'],
                "view_count": response['items'][0]['statistics'].get('viewCount', 0)
            }
        except Exception as e:
            print(f"⚠️ Metadata Error for {video_id}: {str(e)}")
            return {"title": "Error", "description": str(e)}

    async def process_youtube_url(self, url: str, theme: str = "YOUTUBE") -> Dict[str, Any]:
        """유튜브 URL 투입 시 전 공정 처리"""
        video_id = self._extract_video_id(url)
        if not video_id:
            raise ValueError("Invalid YouTube URL")

        print(f"🎬 Processing YouTube: {video_id}")
        
        # 1. 메타데이터 및 자막 동시 확보
        metadata = await self.get_video_metadata(video_id)
        transcript = await self.fetch_transcript(video_id)
        
        if not transcript:
            raise ValueError("Could not extract transcript from this video.")

        # 2. 소스 패키징
        source_data = {
            "id": f"yt_{video_id}",
            "title": metadata['title'],
            "url": url,
            "video_id": video_id,
            "content": transcript,
            "metadata": metadata,
            "theme": theme,
            "source_type": "YOUTUBE",
            "collected_at": datetime.now().isoformat()
        }

        # 3. 로컬 저장
        file_path = self.raw_data_dir / f"yt_{video_id}.json"
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(source_data, f, ensure_ascii=False, indent=2)

        print(f"✅ YouTube source saved: {metadata['title']}")
        return source_data

youtube_fetcher_agent = YoutubeFetcherAgent()
