import os
import json
import sys
import uuid
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from openai import OpenAI
from core.config import settings

# --- standalone execution support ---
if __name__ == "__main__":
    current_file = Path(__file__).resolve()
    api_root = current_file.parent.parent.parent
    if str(api_root) not in sys.path:
        sys.path.insert(0, str(api_root))

class LongformScene(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    phase: str # 도입, 전개, 위기, 절정, 결말 등
    text: str # 자막 및 나레이션
    visual_direction: str # 화면 연출 지시사항
    duration: float # 장면 길이 (초)

class LongformScript(BaseModel):
    title: str
    target_duration: float # 목표 시간 (초)
    actual_duration: float = 0.0
    scenes: List[LongformScene]
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class LongformArchitectAgent:
    """agent_2_longform_architect: 30초~3분 분량의 심도 있는 지식 비즈니스 대본을 설계하는 전문 요원"""
    def __init__(self):
        self.project_root = Path("C:/LinkDropV2")
        self.refined_dir = self.project_root / "packages" / "data" / "02_지식_서랍장"
        self.output_dir = self.project_root / "packages" / "data" / "03_조립_작업대" / "LONGFORM"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_long_script(self, file_path: Path, target_minutes: float = 2.0) -> Optional[Dict[str, Any]]:
        """Gold 소스를 읽어 깊이 있는 롱폼 대본 생성"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            target_seconds = target_minutes * 60
            print(f"🎬 [LongformArchitect] Designing {target_minutes}min Script: {data.get('title', 'Untitled')[:25]}...")

            prompt = f"""
            당신은 지식 비즈니스 전문 시나리오 작가입니다. 
            다음 'Gold' 지식을 바탕으로 약 {target_minutes}분 분량의 [유튜브 롱폼] 대본을 작성하세요.
            
            [지식 내용]:
            {data['content'][:4000]}
            
            [구성 전략]:
            1. 도입(Hook): 15초 이내, 시청자의 궁금증 유발.
            2. 본론: 3~4개의 핵심 포인트로 나누어 상세 설명.
            3. 결론: 핵심 요약 및 구독/좋아요 유도.
            
            [결과 형식(JSON)]:
            {{
                "title": "{data['title']}",
                "target_duration": {target_seconds},
                "scenes": [
                    {{
                        "phase": "도입/본론1/본론2/결론 등",
                        "text": "나레이션 및 자막 내용",
                        "visual_direction": "카메라 앵글 및 화면에 띄울 자료 묘사",
                        "duration": 8.5
                    }}
                ]
            }}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "system", "content": "You are a master scriptwriter for educational YouTube content."},
                          {"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            script_raw = json.loads(response.choices[0].message.content)

            # 데이터 검증 및 저장
            script = LongformScript(**script_raw)
            script.actual_duration = sum(s.duration for s in script.scenes)

            save_path = self.output_dir / f"longform_{data.get('id', uuid.uuid4())}.json"
            with open(save_path, 'w', encoding='utf-8') as f:
                json.dump(script.dict(), f, ensure_ascii=False, indent=2)

            print(f"✨ [LongformArchitect] Long-form Script Completed: {save_path.name} ({script.actual_duration:.1f}s)")
            return script.dict()

        except Exception as e:
            print(f"❌ [LongformArchitect] Error: {e}")
            return None

longform_architect_agent = LongformArchitectAgent()

# --- 독립 실행 테스트 코드 ---
if __name__ == "__main__":
    async def test():
        agent = LongformArchitectAgent()
        print("🚀 [TEST] 롱폼 아키텍트 테스트 시작")
        # 최근에 생성된 Gold 파일 하나를 찾아 테스트
        gold_files = list(Path("C:/LinkDropV2/packages/data/02_지식_서랍장").rglob("GOLD_*.json"))
        if gold_files:
            await agent.generate_long_script(gold_files[0], target_minutes=1.5)
        else:
            print("⚠️ 테스트할 Gold 파일이 없습니다. 에이전트 1을 먼저 돌려주세요.")
        print("🏁 [TEST] 롱폼 아키텍트 테스트 완료")

    asyncio.run(test())
