from supabase import create_client, Client
from core.config import settings

def get_supabase() -> Client:
    """
    Supabase 클라이언트를 초기화하여 반환합니다.
    """
    url: str = settings.SUPABASE_URL
    key: str = settings.SUPABASE_ANON_KEY
    
    if not url or not key:
        raise ValueError("Supabase URL or Anon Key is missing in settings.")
        
    return create_client(url, key)

# 전역 싱글톤 인스턴스
supabase: Client = get_supabase()
