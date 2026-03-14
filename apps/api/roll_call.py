import sys
import os
from pathlib import Path

def test_agent_imports():
    print("🕵️ [Kim Director] Final Agent Roll Call (17 Units)...")
    
    agent_dir = Path("C:/LinkDropV2/apps/api/services/agents")
    sys.path.append(str(agent_dir.parent.parent)) # apps/api 추가
    
    agents = [
        "0_content_scout", "0_news_extractor", "0_source_fetcher", "0_video_source_scout",
        "1_deep_analyzer", "1_script_classifier", "1_source_refiner",
        "2_content_manager", "2_content_planner", "2_data_transformer", "2_shorts_scripter", "2_video_architect",
        "3_drive_syncer", "3_email_sender",
        "4_content_system", "4_monitor", "4_telegram_bot"
    ]
    
    success_count = 0
    for agent in agents:
        try:
            print(f"Calling: {agent}...", end=" ")
            # services.agents.X 형식으로 임포트 시도
            __import__(f"services.agents.{agent}")
            print("✅ Present")
            success_count += 1
        except Exception as e:
            print(f"❌ ABSENT! ({str(e)})")
            
    print("-" * 40)
    print(f"📢 Total: {success_count}/17 Agents Ready for Duty.")

if __name__ == "__main__":
    test_agent_imports()
