import os
import json
import uuid
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
from openai import OpenAI
from dotenv import load_dotenv

class DataTransformer:
    """
    [Skill-2-04] 지식 조립 에이전트 (독립형)
    - 정제된 골드(GOLD) 지식을 Rule 104 표준 기반의 영상 대본으로 변환
    - 시니어 가독성 및 효과음 타이밍을 고려한 장면(Scene) 설계
    """
    def __init__(self, 
                 input_base: str = "packages/data/02_지식_서랍장",
                 output_base: str = "packages/data/03_조립_작업대"):
        load_dotenv()
        self.project_root = Path(os.getcwd())
        self.input_dir = self.project_root / input_base
        self.output_dir = self.project_root / output_base
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("⚠️ [DataTransformer] OPENAI_API_KEY not found.")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)

    async def generate_script(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """GOLD 지식을 영상 대본으로 변환"""
        if not self.client: return None
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if data.get("status") != "GOLD":
                return None

            print(f"🎨 [DataTransformer] Assembling Script: {data.get('title', 'Untitled')[:20]}...")

            prompt = f"""
            당신은 시니어 지식 콘텐츠 전문가입니다. 
            다음 지식을 바탕으로 [Rule 104 표준] 영상 대본을 작성하세요.
            
            [지식 원문]:
            {data['content'][:2500]}
            
            [설계 지침]:
            1. 장면당 자막은 45자 이내로 시니어 가독성 극대화.
            2. 총 6~12개 장면으로 구성.
            3. 각 장면마다 BGM 대신 효과음(Ding, Whoosh, Pop) 타입을 지정.
            4. 시각적 묘사(Visual Prompt)는 영어로 작성.
            
            [출력 포맷(JSON)]:
            {{
                "title": "{data.get('title', 'Untitled')}",
                "scenes": [
                    {{
                        "text": "시니어용 자막",
                        "visual_prompt": "English visual description for AI image generation",
                        "se_type": "Ding/Whoosh/Pop",
                        "duration": 4.5
                    }}
                ]
            }}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            script_data = json.loads(response.choices[0].message.content)
            script_data["id"] = str(uuid.uuid4())[:8]
            script_data["category"] = data.get("category", "General")
            script_data["total_duration"] = sum(s.get("duration", 4.0) for s in script_data.get("scenes", []))
            script_data["created_at"] = datetime.now().isoformat()
            script_data["source_file"] = file_path.name

            # 결과 저장
            save_path = self.output_dir / f"SCRIPT_{script_data['id']}.json"
            with open(save_path, 'w', encoding='utf-8') as f:
                json.dump(script_data, f, ensure_ascii=False, indent=2)

            print(f"✨ [DataTransformer] Script Created: {save_path.name}")
            return script_data

        except Exception as e:
            print(f"❌ [DataTransformer] Error: {e}")
            return None

    async def run_batch(self):
        """서랍장의 모든 골드 지식을 대본으로 변환"""
        if not self.input_dir.exists(): return
        
        count = 0
        for file_path in self.input_dir.rglob("GOLD_*.json"):
            result = await self.generate_script(file_path)
            if result: count += 1
        
        print(f"✅ [DataTransformer] Batch finished. {count} scripts created.")

if __name__ == "__main__":
    async def test():
        transformer = DataTransformer()
        await transformer.run_batch()
    asyncio.run(test())
