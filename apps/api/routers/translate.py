from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncio
import re
import os
from dotenv import load_dotenv
from ._accent_types import ACCENT_TYPES_PROMPT

load_dotenv()

router = APIRouter(prefix="/api/v1/translate", tags=["Translate"])

class SceneTranslateRequest(BaseModel):
    scenes: list[str]
    genre_en: str = ""
    art_style: str = ""  # 선택된 화풍 ID (ghibli-real, reality 등)
    api_key: str = ""    # 클라이언트가 전달하는 Google API Key


class SceneTranslateResponse(BaseModel):
    success: bool
    visual_prompts: list[str]       # scene_en: 영문 나레이션 (하위 호환)
    scene_visuals: list[str] = []   # 이미지 생성용 시각 묘사 문장
    accents: list[list] = []
    scene_roles: list[str] = []
    scene_hints_en: list[str] = []  # [장면힌트] 영문 번역 (보장된 주입용)


def _clean_scene(text: str, max_len: int = 2000) -> str:
    text = re.sub(r'\[씬\s*\d+\]', '', text)
    text = re.sub(r'\[장면힌트:[^\]]*\]', '', text)
    return text.strip()[:max_len]


def _extract_scene_hint(text: str) -> str:
    """씬 텍스트에서 [장면힌트: ...] 태그 추출"""
    m = re.search(r'\[장면힌트:\s*([^\]]+)\]', text)
    return m.group(1).strip() if m else ""


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


VALID_SCENE_ROLES = {"hook", "intro", "explain", "evidence", "climax", "cta", "conclusion"}

async def _extract_visual_keywords_gemini(scenes: list[str], genre_en: str, art_style: str = "", api_key: str = "") -> tuple[list[str], list[str], list[list], list[str], list[str]]:
    """Gemini Flash로 씬 텍스트 → scene_en + scene_visual + accent + scene_role + hint_en 동시 추출 (병렬)"""
    import json as _json
    from google import genai

    client = genai.Client(api_key=api_key)
    style_rule = ART_STYLE_RULES.get(art_style, "")

    async def _process_one(scene: str) -> tuple[str, str, list, str, str]:
        scene_hint = _extract_scene_hint(scene)
        cleaned = _clean_scene(scene)
        if not cleaned:
            return "", "", [], "", ""

        metaphor_hint = _inject_visual_hints(cleaned)
        hint_parts = [h for h in [scene_hint, metaphor_hint] if h]
        if hint_parts:
            if scene_hint:
                metaphor_block = (
                    f"\nREQUIRED VISUAL SCENARIO: Your scene_visual MUST directly describe this exact physical setting: \"{scene_hint}\""
                )
                if metaphor_hint:
                    metaphor_block += f"\nAdditional visual context: {metaphor_hint}"
            else:
                metaphor_block = f"\nVisual context: {metaphor_hint}"
        else:
            metaphor_block = ""

        hint_en_rule = (
            f'- Translate this hint: "{scene_hint}"' if scene_hint
            else '- No hint present — return ""'
        )
        style_rule_line = f"- {style_rule}" if style_rule else ""
        scene_hint_mandatory = (
            f'- MANDATORY: Your scene_visual MUST physically describe this exact setting: "{scene_hint}". Do NOT replace it with a generic scene.'
            if scene_hint else ""
        )

        prompt = f"""You are an image prompt and visual accent extractor for Korean video scenes.

Given a Korean scene description, output ONLY a single JSON object with these fields:

{{
  "scene_en": "<full English narration translation of the Korean scene>",
  "scene_visual": "<2 complete English sentences describing the visual scene for AI image generation>",
  "hint_en": "<English translation of the [장면힌트] tag content, or empty string if no hint>",
  "scene_role": "<one of: hook | intro | explain | evidence | climax | cta | conclusion>",
  "accents": [<accent objects>]
}}

scene_en rules:
- Full fluent English translation of the Korean narration
- Complete sentences, natural reading flow

hint_en rules:
- MANDATORY FIELD when [장면힌트] tag is present in the scene
- Translate the [장면힌트] content into fluent, visual English (1 sentence, max 20 words)
- Describe the exact physical setting/action the author intended as a vivid image caption
- Example: [장면힌트: 텅 빈 신축 아파트 단지 위로 경매 딱지가 눈비처럼 쏟아지는 모습]
  → "Auction notice papers raining down like snow over a ghost-town new apartment complex"
- If NO [장면힌트] tag exists in the scene, return EXACTLY: ""
{hint_en_rule}

scene_visual rules:
- Write EXACTLY 2 complete English sentences describing the visual scene for AI image generation
- SENTENCE 1: Describe the main subject (WHO), location (WHERE), and physical action/pose
- SENTENCE 2: Describe lighting, atmosphere, color tone, and emotional mood
- Minimum 30 words REQUIRED — if your output is under 30 words, rewrite with more detail
- Be cinematically specific: include spatial relationships, textures, camera angle impression
- Good: "A weary middle-aged Korean man sits hunched at a cluttered kitchen table, stacks of unpaid bills surrounding him, a dim lamp casting harsh shadows on his tired face. The room feels oppressively small, with peeling wallpaper and a grey overcast sky visible through a foggy window behind him."
- Bad: "man at table with bills" (too sparse — no scene structure)
- NEVER write: "The scene shows..." or "This image depicts..." — start directly with the subject
{style_rule_line}
{metaphor_block if metaphor_block else ''}
{scene_hint_mandatory}

scene_role rules:
- Choose exactly ONE role that best describes the narrative function of this scene:
  hook: First scene or dramatic attention-grabber that shocks/surprises the viewer
  intro: Introduces the topic, speaker, or context in a welcoming tone
  explain: Explains a concept, process, or data in an informative way
  evidence: Presents proof, statistics, case studies, or real-world examples
  climax: Emotional or narrative peak — the most impactful moment
  cta: Call to action — urges the viewer to subscribe, act, or decide
  conclusion: Final wrap-up, summary, or satisfying resolution

accents rules:
- Extract ALL impactful structures worth visualizing (up to 5 items), as a JSON array
- [] if nothing clearly applies
- IGNORE years (2024, 2023 etc) for "num" type
- Each item at a DIFFERENT point in the text
- Each item MUST include "hint": exact short phrase (5-15 chars) from the text
- Types (choose the most fitting per structure):
{ACCENT_TYPES_PROMPT}

Genre: {genre_en or 'general'}

Scene:
{cleaned}

JSON:"""

        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model="gemini-3-flash-preview",
                contents=prompt,
            )
            raw = response.text.strip()
            # 코드블록 제거
            raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
            raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE)
            # 중괄호 추출 (텍스트가 앞뒤에 붙어도 대응)
            json_match = re.search(r'\{[\s\S]*\}', raw)
            if not json_match:
                raise ValueError("No JSON object found in response")
            parsed = _json.loads(json_match.group())
            scene_en     = parsed.get("scene_en", "").strip()
            scene_visual = parsed.get("scene_visual", "").strip()
            scene_role   = parsed.get("scene_role", "").strip().lower()
            if scene_role not in VALID_SCENE_ROLES:
                scene_role = ""
            raw_accents = parsed.get("accents") or parsed.get("accent") or []
            if isinstance(raw_accents, dict):
                raw_accents = [raw_accents]
            accents = raw_accents if isinstance(raw_accents, list) else []
            # scene_en 폴백: translate 실패 시 Korean 원문까지 3단계 fallback
            if not scene_en:
                fb = _translate_fallback(cleaned)
                scene_en = fb if fb else cleaned
            # scene_visual 품질 보장: 30단어 미만이면 재요청 (1회)
            if len(scene_visual.split()) < 30:
                retry_prompt = (
                    f"You are a visual scene descriptor for AI image generation.\n\n"
                    f"Expand the following into a complete cinematic image prompt (30-50 words).\n"
                    f"Describe: WHO is present and their appearance/pose, WHERE they are (environment), "
                    f"HOW the light falls, WHAT atmosphere/mood is present.\n"
                    f"Write only 1-2 English sentences. No JSON, no labels.\n\n"
                    f"Scene (English): {scene_en}\n"
                    + (f"Required visual scenario: {scene_hint}\n" if scene_hint else "")
                    + f"\nOutput:"
                )
                try:
                    r2 = await asyncio.to_thread(
                        client.models.generate_content,
                        model="gemini-3-flash-preview",
                        contents=retry_prompt,
                    )
                    expanded = r2.text.strip().replace('"', '').replace('\n', ' ')
                    if len(expanded.split()) >= 25:
                        scene_visual = expanded
                except Exception:
                    pass  # 재요청 실패 시 원래 scene_visual 사용
            # hint_en 추출 — Gemini가 번역한 장면힌트 영문 (없으면 "")
            hint_en = parsed.get("hint_en", "").strip()
            # Gemini가 hint_en을 무시했을 때 폴백: _translate_fallback으로 직접 번역
            if scene_hint and not hint_en:
                hint_en = await asyncio.to_thread(_translate_fallback, scene_hint)
                # 번역 실패(한글 그대로 반환)이면 버림
                if any('\uAC00' <= c <= '\uD7A3' for c in hint_en):
                    hint_en = ""
            # scene_visual이 여전히 빈 값이면 hint_en으로 폴백
            if not scene_visual and hint_en:
                scene_visual = hint_en
            return scene_en, scene_visual, accents, scene_role, hint_en
        except Exception:
            fb = _translate_fallback(cleaned)
            return (fb if fb else cleaned), "", [], "", ""

    results = await asyncio.gather(*[_process_one(s) for s in scenes])
    en_results     = [r[0] for r in results]
    visual_results = [r[1] for r in results]
    accent_results = [r[2] for r in results]
    role_results   = [r[3] for r in results]
    hint_results   = [r[4] for r in results]
    return en_results, visual_results, accent_results, role_results, hint_results


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
            visual_prompts, scene_visuals, accents, scene_roles, scene_hints_en = await _extract_visual_keywords_gemini(
                req.scenes, req.genre_en, req.art_style, effective_key
            )
        else:
            visual_prompts = await asyncio.to_thread(
                lambda: [_translate_fallback(_clean_scene(s)) for s in req.scenes],
            )
            scene_visuals  = [""] * len(req.scenes)
            accents        = [[] for _ in req.scenes]
            scene_roles    = [""] * len(req.scenes)
            scene_hints_en = [""] * len(req.scenes)
        return SceneTranslateResponse(
            success=True,
            visual_prompts=visual_prompts,
            scene_visuals=scene_visuals,
            accents=accents,
            scene_roles=scene_roles,
            scene_hints_en=scene_hints_en,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"번역 실패: {str(e)}")
