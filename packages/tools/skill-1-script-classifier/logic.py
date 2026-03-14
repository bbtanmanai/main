import os
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List
from openai import OpenAI
from dotenv import load_dotenv

class ScriptClassifier:
    """
    [Skill-1-03] 지식 테마분류 에이전트 (독립형)
    - 내용을 분석하여 5대 핵심 카테고리 중 가장 적합한 테마를 선별합니다.
    - 독립적인 LLM 연동 및 분류 로직 보유
    """
    def __init__(self):
        load_dotenv()
        self.project_root = Path(os.getcwd())
        self.vault_dir = self.project_root / "packages" / "data" / "02_지식_서랍장"
        self.categories = [
            "01_건강_웰빙", 
            "02_재테크_수익", 
            "03_기술_트렌드", 
            "04_지혜_명언", 
            "05_라이프스타일"
        ]
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("⚠️ [ScriptClassifier] OPENAI_API_KEY not found.")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)

    async def classify(self, text: str) -> str:
        """내용을 분석하여 최적의 카테고리 태그 반환"""
        if not self.client: return "05_라이프스타일"
        
        print(f"🏷️ [ScriptClassifier] Classifying content (Length: {len(text)})...")
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"지식 콘텐츠 전문가로서 다음 텍스트에 가장 적합한 카테고리 하나를 선택하세요: {', '.join(self.categories)}"},
                    {"role": "user", "content": f"텍스트: {text[:1000]}"}
                ]
            )
            
            selected = response.choices[0].message.content.strip()
            # 정확한 카테고리 매칭 확인
            for cat in self.categories:
                if cat in selected:
                    print(f"✅ [ScriptClassifier] Result: {cat}")
                    return cat
            
            return "05_라이프스타일"
        except Exception as e:
            print(f"❌ [ScriptClassifier] Classification failed: {e}")
            return "05_라이프스타일"

    async def classify_and_move(self, file_path: Path):
        """파일을 읽어 분류하고 테마별 폴더로 이동 (선택적 기능)"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            content = data.get("content", data.get("title", ""))
            category = await self.classify(content)
            
            # 메타데이터 업데이트
            data["category"] = category
            data["classified_at"] = datetime.now().isoformat()
            
            # 저장 경로 확보
            save_dir = self.vault_dir / category
            save_dir.mkdir(parents=True, exist_ok=True)
            
            # 결과 저장
            with open(save_dir / file_path.name, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            return category
        except Exception as e:
            print(f"❌ [ScriptClassifier] File process error: {e}")
            return None

from datetime import datetime
if __name__ == "__main__":
    async def test():
        classifier = ScriptClassifier()
        result = await classifier.classify("오늘의 명언: 어제보다 나은 오늘을 사세요. 꾸준함이 승리합니다.")
        print(f"Test Result: {result}")
    asyncio.run(test())
