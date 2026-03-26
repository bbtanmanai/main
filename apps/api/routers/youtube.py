from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import re
import asyncio
import subprocess
import tempfile
import os
from pathlib import Path
from googleapiclient.discovery import build
from core.config import settings

router = APIRouter(prefix="/api/v1/youtube", tags=["YouTube"])

class ResolveRequest(BaseModel):
    url: str

class ExtractAudioRequest(BaseModel):
    url: str


def _resolve_channel_id(youtube, url: str) -> str | None:
    """채널 URL → channel ID (외부 의존성 없는 독립 함수)"""
    url = url.strip().rstrip('/')

    # /channel/UCxxxx
    m = re.search(r'/channel/(UC[\w-]+)', url)
    if m:
        return m.group(1)

    # /@handle
    m = re.search(r'/@([\w.-]+)', url)
    if m:
        handle = m.group(1)
        try:
            res = youtube.channels().list(forHandle=f'@{handle}', part='id').execute()
            items = res.get('items', [])
            if items:
                return items[0]['id']
        except Exception:
            pass
        try:
            res = youtube.search().list(q=handle, type='channel', part='id', maxResults=1).execute()
            items = res.get('items', [])
            if items:
                return items[0]['id']['channelId']
        except Exception:
            pass
        return None

    # /c/name or /user/name
    m = re.search(r'(?:/c/|/user/)([\w.-]+)', url)
    if m:
        try:
            res = youtube.search().list(q=m.group(1), type='channel', part='id', maxResults=1).execute()
            items = res.get('items', [])
            if items:
                return items[0]['id']['channelId']
        except Exception:
            pass
        return None

    # 단일 영상 URL → 채널 ID 추출
    m = re.search(r'(?:v=|youtu\.be/|shorts/)([0-9A-Za-z_-]{11})', url)
    if m:
        try:
            res = youtube.videos().list(part='snippet', id=m.group(1)).execute()
            items = res.get('items', [])
            if items:
                return items[0]['snippet']['channelId']
        except Exception:
            pass

    return None


def _fetch_videos(api_key: str, url: str) -> dict:
    """동기 YouTube API 호출 — to_thread로 실행"""
    youtube = build('youtube', 'v3', developerKey=api_key, cache_discovery=False)

    channel_id = _resolve_channel_id(youtube, url)
    if not channel_id:
        return {"error": "채널을 찾을 수 없습니다."}

    # 채널 구독자 수 조회
    ch_res = youtube.channels().list(part='statistics', id=channel_id).execute()
    ch_items = ch_res.get('items', [])
    subscribers = int(ch_items[0]['statistics'].get('subscriberCount', 0)) if ch_items else 0

    search_res = youtube.search().list(
        channelId=channel_id,
        part='snippet',
        type='video',
        order='date',
        maxResults=50,
    ).execute()

    videos = []
    video_ids = []
    for item in search_res.get('items', []):
        video_id = item['id'].get('videoId')
        if not video_id:
            continue
        snippet = item.get('snippet', {})
        thumbs = snippet.get('thumbnails', {})
        thumbnail_url = (
            thumbs.get('medium', {}).get('url') or
            thumbs.get('default', {}).get('url') or
            f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"
        )
        videos.append({
            'video_id':      video_id,
            'title':         snippet.get('title', ''),
            'url':           f'https://www.youtube.com/watch?v={video_id}',
            'thumbnail_url': thumbnail_url,
            'published_at':  snippet.get('publishedAt', ''),
            'subscribers':   subscribers,
            'views': 0, 'likes': 0, 'comments': 0,
        })
        video_ids.append(video_id)

    # 영상 통계 일괄 조회 (50개씩 배치)
    stats_map: dict = {}
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i+50]
        stat_res = youtube.videos().list(
            part='statistics',
            id=','.join(batch),
        ).execute()
        for s in stat_res.get('items', []):
            st = s.get('statistics', {})
            stats_map[s['id']] = {
                'views':    int(st.get('viewCount', 0)),
                'likes':    int(st.get('likeCount', 0)),
                'comments': int(st.get('commentCount', 0)),
            }

    for v in videos:
        st = stats_map.get(v['video_id'], {})
        v['views']    = st.get('views', 0)
        v['likes']    = st.get('likes', 0)
        v['comments'] = st.get('comments', 0)

    # LinkDrop 점수 기준 상위 20개만 반환
    for v in videos:
        views, likes, comments = v['views'], v['likes'], v['comments']
        if not subscribers or not views:
            v['viral_score'] = 0
        else:
            view_ratio = (views / subscribers) * 100
            engagement = ((likes + comments * 5) / views) * 100
            v['viral_score'] = round(view_ratio * (1 + engagement * 0.05) * 10) / 10
    videos.sort(key=lambda v: v['viral_score'], reverse=True)
    videos = videos[:20]

    return {"channel_id": channel_id, "subscribers": subscribers, "videos": videos}


@router.post("/resolve-channel")
async def resolve_channel_from_url(request: ResolveRequest):
    """채널 URL → 점수 상위 20개 영상 반환"""
    if not settings.YOUTUBE_API_KEY:
        raise HTTPException(status_code=500, detail="YOUTUBE_API_KEY 미설정")

    try:
        result = await asyncio.to_thread(_fetch_videos, settings.YOUTUBE_API_KEY, request.url.strip())
    except Exception as e:
        import traceback
        print(f"Resolve Error: {traceback.format_exc()}")
        return {"success": False, "error": str(e)}

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return {
        "success": True,
        "channel_id": result["channel_id"],
        "total": len(result["videos"]),
        "videos": result["videos"],
    }


def _do_extract_audio(url: str, output_dir: str) -> str:
    """yt-dlp로 오디오 추출 → MP3 반환 (동기)"""
    import sys
    out_template = os.path.join(output_dir, "%(id)s.%(ext)s")
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "5",
        "--no-playlist",
        "-o", out_template,
        url,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp 오류: {result.stderr[-300:]}")

    # 생성된 mp3 파일 탐색
    for f in Path(output_dir).glob("*.mp3"):
        return str(f)
    raise RuntimeError("MP3 파일을 찾을 수 없습니다.")


@router.post("/extract-audio")
async def extract_audio(req: ExtractAudioRequest):
    """유튜브 영상 URL → 오디오 MP3 추출"""
    output_dir = Path("C:/LinkDropV2/tmp/audio")
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        audio_path = await asyncio.to_thread(_do_extract_audio, req.url, str(output_dir))
        return {"success": True, "audio_path": audio_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
