import os
import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from openai import OpenAI
from dotenv import load_dotenv

class KnowledgeRefiner:
    """
    [Skill-1-02] 지식 정제 에이전트 (독립형)
    - 원재료(RAW)를 분석하여 영상 제작 가치가 높은 골드(GOLD) 지식 선별
    - 독립적인 LLM 연동 및 스코어링 로직 보유
    """
    def __init__(self, 
                 input_base: str = "packages/data/01_재료_하차장",
                 output_base: str = "packages/data/02_지식_서랍장"):
        load_dotenv() # 독립적으로 .env 로드
        self.project_root = Path(os.getcwd())
        self.raw_dir = self.project_root / input_base
        self.gold_dir = self.project_root / output_base
        self.gold_dir.mkdir(parents=True, exist_ok=True)
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("⚠️ [KnowledgeRefiner] OPENAI_API_KEY not found in environment.")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)

    async def run_refinement(self, threshold: int = 7):
        """테마별 하차장을 스캔하여 정제 공정 가동"""
        if not self.client: return
        
        print("🧠 [KnowledgeRefiner] Scanning raw materials for refinement...")
        
        if not self.raw_dir.exists():
            print(f"📂 [KnowledgeRefiner] Input directory {self.raw_dir} does not exist.")
            return

        for theme_path in self.raw_dir.iterdir():
            if not theme_path.is_dir(): continue
            theme_id = theme_path.name
            
            raw_files = list(theme_path.glob("RAW_*.json"))
            for raw_file in raw_files:
                await self._process_file(raw_file, theme_id, threshold)

    async def _process_file(self, file_path: Path, theme: str, threshold: int):
        """AI 스코어링 및 고품질 데이터 선별 저장"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                raw_data = json.load(f)
            
            # AI 분석 요청
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"당신은 콘텐츠 전문가입니다. 입력된 지식을 {theme} 테마의 영상 대본으로 만들기 위해 정제하세요."},
                    {"role": "user", "content": f"제목: {raw_data['title']}\n본문: {raw_data['content'][:2000]}\n\n1.핵심요약(3줄), 2.영상화점수(0-10), 3.강조키워드(3개)를 JSON으로 반환하세요."}
                ],
                response_format={"type": "json_object"}
            )
            
            analysis = json.loads(response.choices[0].message.content)
            score = analysis.get("영상화점수", 0)
            
            if score >= threshold:
                gold_data = {
                    **raw_data,
                    "analysis": analysis,
                    "refined_at": datetime.now().isoformat(),
                    "status": "GOLD"
                }
                self._save_to_gold(gold_data, theme)
                # 처리 완료된 원본은 삭제하여 중복 방지 (독립적 파이프라인)
                file_path.unlink()
                print(f"🏆 [KnowledgeRefiner] GOLD Saved ({score}/10): {raw_data['title'][:20]}")
            else:
                print(f"♻️ [KnowledgeRefiner] Skipped ({score}/10): {raw_data['title'][:20]}")
                # 점수 미달인 경우 아카이브하거나 삭제 (여기선 삭제)
                file_path.unlink()

        except Exception as e:
            print(f"❌ [KnowledgeRefiner] Error processing {file_path.name}: {e}")

    def _save_to_gold(self, data: Dict[str, Any], theme: str):
        save_dir = self.gold_dir / theme
        save_dir.mkdir(parents=True, exist_ok=True)
        file_path = save_dir / f"GOLD_{data['id'][:8]}.json"
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    async def test():
        refiner = KnowledgeRefiner()
        await refiner.run_refinement()
    asyncio.run(test())
