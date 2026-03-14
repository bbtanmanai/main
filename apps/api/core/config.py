import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    # Base Paths
    PROJECT_ROOT: Path = Path(__file__).parent.parent.parent.parent
    API_DIR: Path = PROJECT_ROOT / "apps" / "api"
    DATA_DIR: Path = PROJECT_ROOT / "packages" / "data"
    REFINED_DATA_DIR: Path = DATA_DIR / "refined"
    
    # Supabase Settings
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # API Keys
    YOUTUBE_API_KEY: str
    OPENAI_API_KEY: str
    
    # NotebookLM Settings
    YOUTUBE_EXTRACT_NOTEBOOK_ID: str

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding='utf-8',
        extra='ignore'
    )

settings = Settings()
