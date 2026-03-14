import os
from datetime import datetime
from pathlib import Path

class EmailSenderAgent:
    """3_email-sender: 공정 완료 알림 및 뉴스레터를 사용자에게 발송하는 에이전트"""
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent.parent

    async def send_notification(self, message: str):
        """이메일 발송 로직"""
        print(f"📧 [EmailSender] Sending notification: {message[:30]}...")
        return {"agent": "3_email-sender", "status": "sent"}

email_sender_agent = EmailSenderAgent()
