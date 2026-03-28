from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncio
import re
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/v1/translate", tags=["Translate"])

class SceneTranslateRequest(BaseModel):
    scenes: list[str]
    genre_en: str = ""
    art_style: str = ""  # 선택된 화풍 ID (ghibli-real, reality 등)
    api_key: str = ""    # 클라이언트가 전달하는 Google API Key


class SceneTranslateResponse(BaseModel):
    success: bool
    visual_prompts: list[str]
    accents: list[list] = []


def _clean_scene(text: str, max_len: int = 2000) -> str:
    text = re.sub(r'\[씬\s*\d+\]', '', text)
    return text.strip()[:max_len]


ART_STYLE_RULES = {
    "ghibli-real": "STYLE: Studio Ghibli watercolor. NEVER use: realistic, photography, photo, RAW, DSLR, lens, 35mm, documentary, cinematic realism",
    "ghibli-night": "STYLE: Studio Ghibli night watercolor. NEVER use: realistic, photography, photo, RAW, DSLR, lens, 35mm, documentary, cinematic realism",
    "reality": "STYLE: Documentary photography. NEVER use: anime, ghibli, watercolor, illustration, painted, cartoon, 3D render, pixar",
    "anime-sf": "STYLE: Anime sci-fi. NEVER use: realistic, photography, photo, RAW, documentary, watercolor, ghibli",
    "pixar-3d": "STYLE: Pixar 3D render. NEVER use: realistic, photography, photo, RAW, documentary, watercolor, ghibli, anime",
    "econ-documentary": "STYLE: Documentary photography. NEVER use: anime, ghibli, watercolor, illustration, painted, cartoon, 3D render",
    "econ-dark-drama": "STYLE: Dark dramatic cinema. NEVER use: anime, ghibli, watercolor, cartoon, cute, bright, cheerful",
}


# 경제 개념 → 시각 은유 사전 (추상 개념을 구체적 이미지로 매핑)
ECON_VISUAL_METAPHORS = {
    "금리": "interest rate meter rising, central bank pressure gauge, tightening grip on currency",
    "인플레이션": "overflowing market basket, price tag storm, shrinking wallet",
    "연금": "savings jar counting down, elderly hands holding coins, calendar with retirement date",
    "빈곤": "empty wallet on table, worn-out shoes, faded street corner",
    "부채": "heavy chain weighing down, debt mountain, red balance sheet",
    "투자": "growing plant in coin pot, rising stock arrow, seed money sprouting",
    "주식": "stock chart surge, trading floor energy, bull charging upward",
    "부동산": "housing price tower, locked door with price tag, apartment skyline",
    "월급": "paycheck shrinking, salary envelope, clock and money exchange",
    "절약": "piggy bank filling, frugal meal on table, coupon cutting hands",
    "세금": "government hand taking from wallet, tax form burden, deducted paycheck",
    "경제": "global network flow, GDP scale, market pulse wave",
    "노후": "empty nest at sunset, retirement calendar, aging couple walking",
}

def _inject_visual_hints(cleaned: str) -> str:
    """씬 텍스트에서 경제 키워드 감지 → 시각 힌트 추가"""
    hints = []
    for keyword, metaphor in ECON_VISUAL_METAPHORS.items():
        if keyword in cleaned:
            hints.append(metaphor)
    if hints:
        return f"Visual metaphor hints: {'; '.join(hints[:3])}"
    return ""


def _extract_visual_keywords_gemini(scenes: list[str], genre_en: str, art_style: str = "", api_key: str = "") -> tuple[list[str], list[list]]:
    """Gemini Flash로 씬 텍스트 → 이미지 비주얼 키워드 + 강조 accent 배열 동시 추출"""
    import json as _json
    from google import genai

    client = genai.Client(api_key=api_key)
    style_rule = ART_STYLE_RULES.get(art_style, "")

    visual_results: list[str] = []
    accent_results: list[list] = []

    for i, scene in enumerate(scenes):
        cleaned = _clean_scene(scene)
        if not cleaned:
            visual_results.append("")
            accent_results.append([])
            continue

        # 씬 간 연속성: 이전 씬 비주얼 키워드 컨텍스트로 전달
        prev_visual = visual_results[i - 1] if i > 0 and visual_results else ""
        continuity_hint = f"\nPrevious scene visual (maintain continuity): {prev_visual}" if prev_visual else ""

        # 경제 개념 시각 은유 힌트
        metaphor_hint = _inject_visual_hints(cleaned)
        metaphor_block = f"\n{metaphor_hint}" if metaphor_hint else ""

        prompt = f"""You are an image prompt and visual accent extractor for Korean video scenes.

Given a Korean scene description, output ONLY a single JSON object with these fields:

{{
  "visual_prompt": "<5-8 comma-separated English visual keywords for AI image generation>",
  "accents": [<accent objects>]
}}

visual_prompt rules:
- Comma-separated English keywords only, no sentences
- Focus on: subject, environment, lighting, mood, composition, camera angle
- Be specific (e.g. "golden hour sunlight" not "light")
- Must match art style — do NOT include conflicting style keywords
{f'- {style_rule}' if style_rule else ''}{continuity_hint}{metaphor_block}

accents rules:
- Extract ALL impactful statistics worth visualizing (up to 5 items), as a JSON array
- [] if no clear statistics
- IGNORE years (2024, 2023 etc)
- PREFER: 만/억/조 unit counts, percentages, head-to-head comparisons, ordered lists
- Each item at a DIFFERENT point in the text
- Each item MUST include "hint": exact short phrase (5-15 chars) from the text near that statistic
- Types:
  - "num":  {{"type":"num",  "value":"49만개",  "label":"사업장 폐업",             "hint":"49만 개의 사업장"}}
  - "bar":  {{"type":"bar",  "left":{{"label":"이삭","value":"39.8%"}},"right":{{"label":"파리크라상","value":"50%이상"}}, "hint":"39.8퍼센트야"}}
  - "flow": {{"type":"flow", "steps":["1단계","2단계"],                            "hint":"먼저 스트레칭"}}
  - "list": {{"type":"list", "items":["항목1","항목2"],                            "hint":"첫째 아침"}}

Genre: {genre_en or 'general'}

Scene:
{cleaned}

JSON:"""

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            raw = response.text.strip()
            raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
            raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE)
            parsed = _json.loads(raw)
            visual_results.append(parsed.get("visual_prompt", "").strip())
            raw_accents = parsed.get("accents") or parsed.get("accent") or []
            if isinstance(raw_accents, dict):
                raw_accents = [raw_accents]
            accent_results.append(raw_accents if isinstance(raw_accents, list) else [])
        except Exception:
            visual_results.append(_translate_fallback(cleaned))
            accent_results.append([])

    return visual_results, accent_results


def _translate_fallback(text: str) -> str:
    """Gemini 실패 시 Google 무료 번역 폴백"""
    try:
        from deep_translator import GoogleTranslator
        translated = GoogleTranslator(source="ko", target="en").translate(text[:200])
        return translated.replace('"', '').replace('\n', ' ').strip()
    except Exception:
        return text


@router.post("/scenes", response_model=SceneTranslateResponse)
async def translate_scenes(req: SceneTranslateRequest):
    """한국어 씬 텍스트 목록 → 영문 비주얼 키워드 목록 (Gemini Flash)"""
    if not req.scenes:
        raise HTTPException(status_code=400, detail="씬 목록이 비어 있습니다.")

    effective_key = req.api_key.strip() or os.environ.get("GOOGLE_API_KEY", "")

    try:
        if effective_key:
            visual_prompts, accents = await asyncio.to_thread(
                _extract_visual_keywords_gemini, req.scenes, req.genre_en, req.art_style, effective_key
            )
        else:
            visual_prompts = await asyncio.to_thread(
                lambda: [_translate_fallback(_clean_scene(s)) for s in req.scenes],
            )
            accents = [None] * len(req.scenes)
        return SceneTranslateResponse(success=True, visual_prompts=visual_prompts, accents=accents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"번역 실패: {str(e)}")
