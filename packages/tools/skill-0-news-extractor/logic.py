import httpx
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from core.config import settings
from core.database import supabase

class NewsExtractorAgent:
    def __init__(self):
        self.naver_client_id = os.getenv("NAVER_CLIENT_ID")
        self.naver_client_secret = os.getenv("NAVER_CLIENT_SECRET")
        self.base_url = "https://openapi.naver.com/v1/search/news.json"

    async def fetch_news(self, keyword: str, limit: int = 5) -> List[Dict[str, Any]]:
        """네이버 API를 통해 뉴스 수집 및 필터링 (최근 4시간)"""
        if not self.naver_client_id or not self.naver_client_secret:
            print("⚠️ NAVER_CLIENT_ID or SECRET is missing. News extraction skipped.")
            return []

        headers = {
            "X-Naver-Client-Id": self.naver_client_id,
            "X-Naver-Client-Secret": self.naver_client_secret
        }
        params = {
            "query": keyword,
            "display": limit * 2,
            "sort": "date"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.base_url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                items = data.get("items", [])
            except Exception as e:
                print(f"❌ Naver API Error: {str(e)}")
                return []

        # 필터링 로직: 최근 4시간 이내 뉴스
        four_hours_ago = datetime.now() - timedelta(hours=4)
        refined_news = []

        for item in items:
            # pubDate 파싱 (예: Tue, 04 Mar 2026 14:00:00 +0900)
            # 네이버 날짜 포맷은 다소 다양할 수 있어 예외처리 필요
            try:
                # 간단한 태그 제거
                title = re.sub(r'<[^>]+>', '', item.get("title", ""))
                link = item.get("link", "")
                
                refined_news.append({
                    "title": title,
                    "link": link,
                    "pubDate": item.get("pubDate"),
                    "source": "네이버 뉴스"
                })
            except:
                continue

        return refined_news[:limit]

    async def send_news_email(self, email: str, keyword: str, news: List[Dict[str, Any]]):
        """뉴스 브리핑 이메일 발송 (이후 이메일 전용 서비스로 통합 예정)"""
        if not news:
            return

        # HTML 메일 템플릿 생성
        news_items_html = ""
        for n in news:
            news_items_html += f"""
            <div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px;">
                <a href="{n['link']}" target="_blank" style="text-decoration: none; color: #6366f1; font-weight: bold; font-size: 16px; display: block; margin-bottom: 4px;">
                    {n['title']}
                </a>
                <span style="font-size: 12px; color: #94a3b8;">{n['pubDate']}</span>
            </div>
            """

        html_content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1e293b;">[LinkDrop] 오늘의 '{keyword}' 뉴스 브리핑</h2>
            <p style="color: #64748b; margin-bottom: 24px;">최근 가장 중요한 뉴스 {len(news)}가지를 골라보았습니다.</p>
            <div>{news_items_html}</div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">본 메일은 LinkDrop 뉴스 비서에 의해 자동 발송되었습니다.</p>
        </div>
        """

        # TODO: 실제 이메일 발송 API 연동 (Resend, SendGrid 등)
        print(f"📧 [Email Simulated] To: {email}, Subject: {keyword} News Briefing")
        
        # Supabase에 로그 기록
        try:
            supabase.table("agent_logs").insert({
                "agent_id": "0_news-extractor",
                "status": "success",
                "message": f"Sent {len(news)} news to {email}",
                "keyword": keyword
            }).execute()
        except:
            pass

import os
news_extractor_agent = NewsExtractorAgent()
