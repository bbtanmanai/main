import os
import json
import math
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

    # ------------------------------------------------------------------ #
    #  Channel Video Crawler                                               #
    # ------------------------------------------------------------------ #

    def _calc_viral_score(self, views: int, likes: int, comments: int, subscribers: int) -> float:
        """0~10점 바이럴 점수. 조회수(0~4) + 참여율(0~3) + 확산력(0~3)."""
        if views >= 1_000_000:
            view_score = 4.0
        elif views >= 100_000:
            view_score = 3.0 + (math.log10(views) - 5)
        elif views >= 10_000:
            view_score = 2.0 + (math.log10(views) - 4)
        elif views >= 1_000:
            view_score = 1.0 + (math.log10(views) - 3)
        else:
            view_score = 0.0

        if views > 0:
            engagement = (likes + comments) / views
            if engagement >= 0.05:
                eng_score = 3.0
            elif engagement >= 0.02:
                eng_score = 2.0
            elif engagement >= 0.01:
                eng_score = 1.0
            else:
                eng_score = engagement / 0.01
        else:
            eng_score = 0.0

        if subscribers > 0:
            ratio = views / subscribers
            if ratio >= 10:
                spread_score = 3.0
            elif ratio >= 3:
                spread_score = 2.0
            elif ratio >= 1:
                spread_score = 1.0
            else:
                spread_score = ratio
        else:
            spread_score = 1.0

        return round(min(10.0, view_score + eng_score + spread_score), 2)

    def _resolve_channel_id(self, youtube, channel_url: str) -> Optional[str]:
        """Parse channel URL and resolve to channel ID via YouTube Data API."""
        url = channel_url.strip().rstrip('/')

        # /channel/UCxxxx
        m = re.search(r'/channel/(UC[\w-]+)', url)
        if m:
            return m.group(1)

        # /@handle
        m = re.search(r'/@([\w.-]+)', url)
        if m:
            handle = m.group(1)
            try:
                res = youtube.channels().list(
                    forHandle=f'@{handle}',
                    part='id',
                ).execute()
                items = res.get('items', [])
                if items:
                    return items[0]['id']
            except Exception:
                pass
            # fallback: search
            try:
                res = youtube.search().list(
                    q=handle,
                    type='channel',
                    part='id',
                    maxResults=1,
                ).execute()
                items = res.get('items', [])
                if items:
                    return items[0]['id']['channelId']
            except Exception:
                pass
            return None

        # /c/name or /user/name
        m = re.search(r'(?:/c/|/user/)([\w.-]+)', url)
        if m:
            name = m.group(1)
            try:
                res = youtube.search().list(
                    q=name,
                    type='channel',
                    part='id',
                    maxResults=1,
                ).execute()
                items = res.get('items', [])
                if items:
                    return items[0]['id']['channelId']
            except Exception:
                pass
            return None

        # bare video URL — extract channel from video details
        video_id = self._extract_video_id(url)
        if video_id:
            try:
                res = youtube.videos().list(part='snippet', id=video_id).execute()
                items = res.get('items', [])
                if items:
                    return items[0]['snippet']['channelId']
            except Exception:
                pass

        return None

    def fetch_channel_videos(
        self,
        channel_url: str,
        max_results: int = 30,
        genre: str = 'general',
    ) -> List[Dict[str, Any]]:
        """
        Crawl recent videos from a YouTube channel URL and save to Supabase.

        Supports:
          - /channel/UCxxx
          - /@handle
          - /c/name  or  /user/name
          - any youtube.com video URL (channel auto-detected)

        Returns a list of saved video record dicts.
        """
        if not self.youtube_api_key:
            raise RuntimeError('YOUTUBE_API_KEY is not configured')

        youtube = build('youtube', 'v3', developerKey=self.youtube_api_key)

        # 1. Resolve channel ID
        channel_id = self._resolve_channel_id(youtube, channel_url)
        if not channel_id:
            raise ValueError(f'Cannot resolve channel ID from URL: {channel_url}')

        # 2. Fetch channel metadata (name + subscribers + thumbnail)
        ch_res = youtube.channels().list(
            id=channel_id,
            part='snippet,statistics',
        ).execute()
        ch_items = ch_res.get('items', [])
        channel_name = channel_id
        channel_thumbnail = ''
        subscribers = 0
        if ch_items:
            ch_snippet = ch_items[0].get('snippet', {})
            ch_stats = ch_items[0].get('statistics', {})
            channel_name = ch_snippet.get('title', channel_id)
            subscribers = int(ch_stats.get('subscriberCount', 0))
            thumbs = ch_snippet.get('thumbnails', {})
            channel_thumbnail = (
                thumbs.get('default', {}).get('url', '')
                or thumbs.get('medium', {}).get('url', '')
                or ''
            )

        # 3. Search recent videos from the channel
        search_res = youtube.search().list(
            channelId=channel_id,
            part='id',
            type='video',
            order='date',
            maxResults=min(max_results, 50),
        ).execute()
        video_ids = [
            item['id']['videoId']
            for item in search_res.get('items', [])
            if item['id'].get('videoId')
        ]

        if not video_ids:
            return []

        # 4. Get video details (snippet + statistics)
        details_res = youtube.videos().list(
            id=','.join(video_ids),
            part='snippet,statistics',
        ).execute()

        records: List[Dict[str, Any]] = []
        for item in details_res.get('items', []):
            vid_id = item['id']
            snippet = item.get('snippet', {})
            stats = item.get('statistics', {})

            views = int(stats.get('viewCount', 0))
            likes = int(stats.get('likeCount', 0))
            comments = int(stats.get('commentCount', 0))
            viral_score = self._calc_viral_score(views, likes, comments, subscribers)

            record: Dict[str, Any] = {
                'video_id':          vid_id,
                'title':             snippet.get('title', ''),
                'channel':           channel_name,
                'channel_id':        channel_id,
                'views':             views,
                'subscribers':       subscribers,
                'likes':             likes,
                'comments':          comments,
                'viral_score':       viral_score,
                'url':               f'https://www.youtube.com/watch?v={vid_id}',
                'keyword':           channel_url,
                'template_id':       genre,
                'published_at':      snippet.get('publishedAt') or None,
            }
            if channel_thumbnail:
                record['channel_thumbnail'] = channel_thumbnail

            records.append(record)

        if not records:
            return []

        # 5. Upsert to Supabase
        res = supabase.table('crawl_videos').upsert(records, on_conflict='video_id').execute()
        saved = res.data or []
        print(f'✅ Channel {channel_name}: {len(saved)} videos saved to crawl_videos')
        return saved


youtube_fetcher_agent = YoutubeFetcherAgent()
