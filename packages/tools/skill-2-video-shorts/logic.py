import os
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

class VideoArchitect:
    """
    [Skill-2-05] 영상 설계 에이전트 (독립형)
    - 대본을 '효과음 및 나레이션 중심'의 영상 설계도로 변환
    - 시니어 가독성 및 청각적 몰입감을 고려한 연출 설계
    """
    def __init__(self, 
                 input_base: str = "packages/data/03_조립_작업대",
                 output_base: str = "packages/data/04_출고_대기실/영상_설계도"):
        self.project_root = Path(os.getcwd())
        self.input_dir = self.project_root / input_base
        self.output_dir = self.project_root / output_base
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _design_se_trigger(self, text: str, scene_idx: int) -> Dict[str, Any]:
        """문장 분석을 통한 효과음(SE) 자동 설계"""
        se_type = "none"
        if scene_idx == 0: se_type = "Whoosh" # 오프닝
        elif "?" in text: se_type = "Ding"   # 질문
        elif "!" in text: se_type = "Pop"    # 강조
        
        return {"type": se_type, "timing": "start", "volume": 0.8}

    async def design_blueprint(self, script_data: Dict[str, Any]) -> Dict[str, Any]:
        """대본 데이터를 영상 설계 패키지로 변환"""
        title = script_data.get("title", "Untitled")
        scenes = script_data.get("scenes", [])
        
        print(f"📐 [VideoArchitect] Designing Blueprint: {title}")
        
        blueprint_scenes = []
        for idx, scene in enumerate(scenes):
            # 시니어 가독성을 위한 문장 분할 (필요시)
            text = scene.get("text", "")
            
            blueprint_scene = {
                "id": f"S{idx+1:02d}",
                "text": text,
                "duration": scene.get("duration", 4.5),
                "audio": {
                    "tts_voice": "ko-KR-Standard-D",
                    "se": self._design_se_trigger(text, idx)
                },
                "visual": {
                    "prompt": scene.get("visual_prompt", ""),
                    "animation": "zoom_in" if idx % 2 == 0 else "pan_right"
                }
            }
            blueprint_scenes.append(blueprint_scene)

        blueprint = {
            "metadata": {
                "title": title,
                "total_scenes": len(blueprint_scenes),
                "audio_policy": "SE_FOCUSED",
                "designed_at": datetime.now().isoformat(),
                "script_id": script_data.get("id", "Unknown")
            },
            "scenes": blueprint_scenes
        }

        # 결과 저장
        file_name = f"BLUEPRINT_{datetime.now().strftime('%H%M%S')}.json"
        with open(self.output_dir / file_name, 'w', encoding='utf-8') as f:
            json.dump(blueprint, f, ensure_ascii=False, indent=2)
            
        print(f"✅ [VideoArchitect] Blueprint Complete: {file_name}")
        return blueprint

    async def process_new_scripts(self):
        """새로 생성된 대본들을 자동 설계"""
        if not self.input_dir.exists(): return
        
        for file_path in self.input_dir.glob("SCRIPT_*.json"):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    script_data = json.load(f)
                await self.design_blueprint(script_data)
                # 처리 완료된 대본은 아카이브하거나 삭제 (여기선 원본 유지)
            except Exception as e:
                print(f"❌ [VideoArchitect] Failed to process {file_path.name}: {e}")

if __name__ == "__main__":
    import asyncio
    async def test():
        architect = VideoArchitect()
        await architect.process_new_scripts()
    asyncio.run(test())
