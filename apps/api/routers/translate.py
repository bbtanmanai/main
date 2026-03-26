from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncio
import re
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/v1/translate", tags=["Translate"])

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")


class SceneTranslateRequest(BaseModel):
    scenes: list[str]
    genre_en: str = ""
    art_style: str = ""  # 선택된 화풍 ID (ghibli-real, reality 등)


class SceneTranslateResponse(BaseModel):
    success: bool
    visual_prompts: list[str]


def _clean_scene(text: str) -> str:
    text = re.sub(r'\[씬\s*\d+\]', '', text)
    return text.strip()[:500]


ART_STYLE_RULES = {
    "ghibli-real": "STYLE: Studio Ghibli watercolor. NEVER use: realistic, photography, photo, RAW, DSLR, lens, 35mm, documentary, cinematic realism",
    "ghibli-night": "STYLE: Studio Ghibli night watercolor. NEVER use: realistic, photography, photo, RAW, DSLR, lens, 35mm, documentary, cinematic realism",
    "reality": "STYLE: Documentary photography. NEVER use: anime, ghibli, watercolor, illustration, painted, cartoon, 3D render, pixar",
    "anime-sf": "STYLE: Anime sci-fi. NEVER use: realistic, photography, photo, RAW, documentary, watercolor, ghibli",
    "pixar-3d": "STYLE: Pixar 3D render. NEVER use: realistic, photography, photo, RAW, documentary, watercolor, ghibli, anime",
    "econ-documentary": "STYLE: Documentary photography. NEVER use: anime, ghibli, watercolor, illustration, painted, cartoon, 3D render",
    "econ-dark-drama": "STYLE: Dark dramatic cinema. NEVER use: anime, ghibli, watercolor, cartoon, cute, bright, cheerful",
}


def _extract_visual_keywords_gemini(scenes: list[str], genre_en: str, art_style: str = "") -> list[str]:
    """Gemini Flash로 씬 텍스트 → 이미지 생성용 비주얼 키워드 추출"""
    from google import genai

    client = genai.Client(api_key=GOOGLE_API_KEY)

    style_rule = ART_STYLE_RULES.get(art_style, "")

    results = []
    for scene in scenes:
        cleaned = _clean_scene(scene)
        if not cleaned:
            results.append("")
            continue

        prompt = f"""You are an image prompt keyword extractor.

Given a Korean scene description, extract 5-8 English visual keywords for AI image generation.

Rules:
- Output ONLY comma-separated English keywords, nothing else
- Focus on: subject, environment, lighting, mood, composition, camera angle
- Be specific and visual (e.g. "golden hour sunlight" not just "light")
- No sentences, no explanations, no numbering
- Keywords must match the given art style — do NOT include conflicting style keywords
{f'- {style_rule}' if style_rule else ''}

Genre: {genre_en or 'general'}

Scene:
{cleaned}

Keywords:"""

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            keywords = response.text.strip()
            keywords = re.sub(r'^\d+[\.\)]\s*', '', keywords, flags=re.MULTILINE)
            keywords = keywords.replace('\n', ', ').strip().strip(',').strip()
            results.append(keywords)
        except Exception:
            results.append(_translate_fallback(cleaned))

    return results


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

    try:
        if GOOGLE_API_KEY:
            visual_prompts = await asyncio.to_thread(
                _extract_visual_keywords_gemini, req.scenes, req.genre_en, req.art_style
            )
        else:
            visual_prompts = await asyncio.to_thread(
                lambda: [_translate_fallback(_clean_scene(s)) for s in req.scenes],
            )
        return SceneTranslateResponse(success=True, visual_prompts=visual_prompts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"번역 실패: {str(e)}")
