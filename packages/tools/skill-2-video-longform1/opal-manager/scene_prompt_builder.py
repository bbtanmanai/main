#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
씬 프롬프트 빌더 — AI 개입 없는 직접 조합
============================================
content_styleimage.json 의 정제된 프롬프트(style/lighting/camera/background)를
큐레이션 프리셋 테이블 (art_style × emotion) 또는 키워드 규칙으로 자동 선택하여
Opal AppCatalyst 전용 프롬프트로 조합.

LinkDrop 핵심 원칙: AI 사용 최소화 → 사전 정의된 값으로 최고 결과물 생산

사용법:
  from scene_prompt_builder import build_opal_prompt
  system_instruction, user_content = build_opal_prompt(
      "혈압을 낮추는 시니어 식품", "ghibli-real",
      emotion_id="calm_warm", tone_id="peaceful"
  )
"""

import json
from pathlib import Path

# ── 파일 경로 ──────────────────────────────────────────────────────────────
_ROOT = Path(__file__).parent.parent.parent.parent.parent  # C:\LinkDropV2
STYLEIMAGE_JSON = _ROOT / "apps/web/src/data/content_styleimage.json"
ART_STYLES_JSON = Path(__file__).parent / "art_styles.json"


# ── art_style_id → styleimage style_id 매핑 ───────────────────────────────
STYLE_ID_MAP: dict[str, str] = {
    "ghibli-real":    "style8",
    "ghibli-night":   "style8",
    "hollywood-sf":   "style9",
    "neo-noir":       "style5",
    "anime-sf":       "style13",
    "ink-wash":       "style7",
    "pixar-3d":       "style3",
    "reality":        "style6",
    "pop-art":        "style11",
    "sticker-cutout": "style2",
    "_default":       "style9",
}

# ── ① 큐레이션 프리셋 테이블 (art_style × emotion → 검증된 최적 조합) ───────
# 형식: (lighting_id, background_id, camera_id)
# 직접 테스트로 검증된 조합 → 키워드 매칭보다 우선 적용
CURATED_PRESETS: dict[tuple[str, str], tuple[str, str, str]] = {
    # ── ghibli-real (지브리+실사) ──────────────────────────────────────────
    ("ghibli-real", "calm_warm"):   ("golden_hour",    "nature_forest",   "ws"),
    ("ghibli-real", "dramatic"):    ("volumetric",     "ghibli_alley1",   "crane"),
    ("ghibli-real", "dark"):        ("blue_hour",      "nature_forest",   "low"),
    ("ghibli-real", "energetic"):   ("golden_hour",    "nature_forest",   "drone"),
    ("ghibli-real", "mystical"):    ("bioluminescent", "nature_forest",   "ws"),
    ("ghibli-real", "nostalgic"):   ("golden_hour",    "ghibli_alley1",   "ms"),

    # ── ghibli-night (지브리 야경) ────────────────────────────────────────
    ("ghibli-night", "calm_warm"):  ("bioluminescent", "nature_forest",   "ws"),
    ("ghibli-night", "dramatic"):   ("volumetric",     "ghibli_alley1",   "crane"),
    ("ghibli-night", "dark"):       ("low_key",        "nature_forest",   "low"),
    ("ghibli-night", "energetic"):  ("bioluminescent", "nature_forest",   "drone"),
    ("ghibli-night", "mystical"):   ("bioluminescent", "nature_forest",   "ws"),
    ("ghibli-night", "nostalgic"):  ("blue_hour",      "ghibli_alley1",   "ms"),

    # ── hollywood-sf (할리우드 SF) ────────────────────────────────────────
    ("hollywood-sf", "calm_warm"):  ("soft_window",    "sci_lab",         "ws"),
    ("hollywood-sf", "dramatic"):   ("volumetric",     "sci_lab",         "low"),
    ("hollywood-sf", "dark"):       ("low_key",        "urban_cyber",     "low"),
    ("hollywood-sf", "energetic"):  ("neon_night",     "urban_cyber",     "crane"),
    ("hollywood-sf", "mystical"):   ("bioluminescent", "sci_lab",         "ws"),
    ("hollywood-sf", "nostalgic"):  ("golden_hour",    "sci_lab",         "ms"),

    # ── neo-noir (네오 누아르) ────────────────────────────────────────────
    ("neo-noir", "calm_warm"):      ("soft_window",    "office1",         "ms"),
    ("neo-noir", "dramatic"):       ("shadow_line",    "urban_cyber",     "low"),
    ("neo-noir", "dark"):           ("low_key",        "urban_cyber",     "low"),
    ("neo-noir", "energetic"):      ("neon_night",     "urban_cyber",     "dutch"),
    ("neo-noir", "mystical"):       ("shadow_line",    "urban_cyber",     "ots"),
    ("neo-noir", "nostalgic"):      ("soft_window",    "ghibli_alley1",   "ms"),

    # ── anime-sf (일본 애니 SF) ───────────────────────────────────────────
    ("anime-sf", "calm_warm"):      ("soft_window",    "ghibli_alley1",   "ws"),
    ("anime-sf", "dramatic"):       ("neon_night",     "urban_cyber",     "crane"),
    ("anime-sf", "dark"):           ("low_key",        "urban_cyber",     "low"),
    ("anime-sf", "energetic"):      ("neon_night",     "urban_cyber",     "drone"),
    ("anime-sf", "mystical"):       ("bioluminescent", "urban_cyber",     "ws"),
    ("anime-sf", "nostalgic"):      ("golden_hour",    "ghibli_alley1",   "ms"),

    # ── ink-wash (수묵화) ─────────────────────────────────────────────────
    ("ink-wash", "calm_warm"):      ("soft_window",    "oriental",        "ws"),
    ("ink-wash", "dramatic"):       ("volumetric",     "sketch_landscape","crane"),
    ("ink-wash", "dark"):           ("blue_hour",      "sketch_landscape","low"),
    ("ink-wash", "energetic"):      ("golden_hour",    "oriental",        "drone"),
    ("ink-wash", "mystical"):       ("volumetric",     "sketch_landscape","ws"),
    ("ink-wash", "nostalgic"):      ("soft_window",    "oriental",        "ms"),

    # ── pixar-3d (픽사 3D) ────────────────────────────────────────────────
    ("pixar-3d", "calm_warm"):      ("golden_hour",    "nature_forest",   "ws"),
    ("pixar-3d", "dramatic"):       ("volumetric",     "sci_lab",         "crane"),
    ("pixar-3d", "dark"):           ("blue_hour",      "nature_forest",   "low"),
    ("pixar-3d", "energetic"):      ("golden_hour",    "beach",           "drone"),
    ("pixar-3d", "mystical"):       ("bioluminescent", "nature_forest",   "ws"),
    ("pixar-3d", "nostalgic"):      ("golden_hour",    "ghibli_alley1",   "ms"),

    # ── reality (실사 다큐풍) ─────────────────────────────────────────────
    ("reality", "calm_warm"):       ("golden_hour",    "nature_forest",   "ws"),
    ("reality", "dramatic"):        ("volumetric",     "desert",          "low"),
    ("reality", "dark"):            ("low_key",        "urban_cyber",     "low"),
    ("reality", "energetic"):       ("golden_hour",    "beach",           "drone"),
    ("reality", "mystical"):        ("volumetric",     "nature_forest",   "ws"),
    ("reality", "nostalgic"):       ("golden_hour",    "ghibli_alley1",   "ms"),

    # ── pop-art (팝아트) ──────────────────────────────────────────────────
    ("pop-art", "calm_warm"):       ("soft_window",    "office1",         "ws"),
    ("pop-art", "dramatic"):        ("neon_night",     "urban_cyber",     "crane"),
    ("pop-art", "dark"):            ("shadow_line",    "urban_cyber",     "low"),
    ("pop-art", "energetic"):       ("neon_night",     "urban_cyber",     "drone"),
    ("pop-art", "mystical"):        ("bioluminescent", "urban_cyber",     "ws"),
    ("pop-art", "nostalgic"):       ("golden_hour",    "ghibli_alley1",   "ms"),

    # ── sticker-cutout (스티커 컷아웃) ────────────────────────────────────
    ("sticker-cutout", "calm_warm"):  ("soft_window",  "nature_forest",   "ws"),
    ("sticker-cutout", "dramatic"):   ("golden_hour",  "nature_forest",   "crane"),
    ("sticker-cutout", "dark"):       ("blue_hour",    "nature_forest",   "low"),
    ("sticker-cutout", "energetic"):  ("golden_hour",  "beach",           "drone"),
    ("sticker-cutout", "mystical"):   ("bioluminescent","nature_forest",  "ws"),
    ("sticker-cutout", "nostalgic"):  ("golden_hour",  "ghibli_alley1",   "ms"),
}

# ── 감정 단독 폴백 (화풍 프리셋 없을 때 감정만으로 파라미터 결정) ──────────
EMOTION_LIGHTING: dict[str, str] = {
    "calm_warm":   "golden_hour",
    "dramatic":    "volumetric",
    "dark":        "low_key",
    "energetic":   "neon_night",
    "mystical":    "bioluminescent",
    "nostalgic":   "soft_window",
}
EMOTION_BACKGROUND: dict[str, str] = {
    "calm_warm":   "nature_forest",
    "dramatic":    "desert",
    "dark":        "urban_cyber",
    "energetic":   "beach",
    "mystical":    "nature_forest",
    "nostalgic":   "ghibli_alley1",
}
EMOTION_CAMERA: dict[str, str] = {
    "calm_warm":   "ws",
    "dramatic":    "crane",
    "dark":        "low",
    "energetic":   "drone",
    "mystical":    "ws",
    "nostalgic":   "ms",
}

# ── 감정 → HTML 생성 지시문 (system_instruction에 추가) ─────────────────────
EMOTION_DIRECTIVE: dict[str, str] = {
    "calm_warm":   "EMOTIONAL TONE — Calm & Warm: The scene breathes with warmth and serenity. Soft golden light, gentle drifting motion, soothing color harmony. Everything feels safe and inviting.",
    "dramatic":    "EMOTIONAL TONE — Dramatic: Every element builds tension. Strong contrast between light and shadow, dynamic movement, cinematic depth. Powerful and visually commanding.",
    "dark":        "EMOTIONAL TONE — Dark & Heavy: A brooding, oppressive atmosphere. Deep shadows dominate. Minimal light sources. Slow, heavy particle drift. Cold color temperatures.",
    "energetic":   "EMOTIONAL TONE — Energetic & Dynamic: Vibrant, explosive energy. Fast particle movement, high color saturation, sweeping motion. Full of life and forward momentum.",
    "mystical":    "EMOTIONAL TONE — Mystical & Dreamlike: Otherworldly and surreal. Softly glowing particles, ethereal halos, impossible color blends. Reality feels suspended.",
    "nostalgic":   "EMOTIONAL TONE — Nostalgic: Warm, slightly faded tones. Gentle vignette around edges. A sense of cherished memory and the quiet beauty of passing time.",
}

# ── 톤앤매너 → HTML 생성 지시문 (system_instruction에 추가) ─────────────────
TONE_DIRECTIVE: dict[str, str] = {
    "serious":       "TONE MANNER — Serious: Maintain composed, authoritative visual gravity. Clean lines, measured motion, no frivolous elements.",
    "playful":       "TONE MANNER — Playful: Keep the mood light and bouncy. Soft rounded shapes, gentle color pops, cheerful subtle animations.",
    "inspirational": "TONE MANNER — Inspirational: Build visual uplift — rising motion, expanding light, triumphant warmth. The viewer should feel empowered.",
    "tense":         "TONE MANNER — Tense: Tight composition, sharp contrasts, quick subtle movements that unsettle and create anticipation.",
    "peaceful":      "TONE MANNER — Peaceful: Unhurried, breathing visuals. Slow drifts, soft edges, quiet color transitions. No sudden changes.",
    "authoritative": "TONE MANNER — Authoritative: Clean, precise, powerful. Bold geometry. Confident visual presence. Every element placed with purpose.",
}

# ── 키워드 → 조명 ID ────────────────────────────────────────────────────────
LIGHTING_RULES: list[tuple[list[str], str]] = [
    (["사이버", "네온", "클럽", "나이트클럽", "홀로그램", "형광"],     "neon_night"),
    (["황혼", "황금빛", "노을", "석양", "저녁놀", "황금 시간"],         "golden_hour"),
    (["새벽", "여명", "푸른빛", "고요한 밤", "서늘"],                    "blue_hour"),
    (["빛줄기", "신의 빛", "성스러운", "안개 속 빛", "광선"],            "volumetric"),
    (["발광", "몽환", "마법", "요정", "바이오루미네선스"],                "bioluminescent"),
    (["수중", "해저", "물속", "물결 빛", "캐스틱"],                      "underwater_caustics"),
    (["모닥불", "촛불", "벽난로", "불꽃", "불빛"],                       "firelight"),
    (["창가", "창문 빛", "아침 햇살", "실내 자연광"],                    "soft_window"),
    (["역광", "실루엣", "림라이트", "뒤에서 오는 빛"],                   "backlit"),
    (["어둠", "공포", "긴장감", "칠흑", "심연"],                         "low_key"),
    (["블라인드 그림자", "가로줄 빛", "누아르 조명"],                    "shadow_line"),
]

# ── 키워드 → 배경 ID ───────────────────────────────────────────────────────
BACKGROUND_RULES: list[tuple[list[str], str]] = [
    (["사이버펑크", "미래 도시", "네온 도시", "사이버 거리"],            "urban_cyber"),
    (["숲", "나무", "자연", "수풀", "정글", "밀림"],                     "nature_forest"),
    (["사막", "황야", "광야", "황무지", "모래밭"],                       "desert"),
    (["해변", "바닷가", "모래사장", "해안", "열대 해변"],                "beach"),
    (["도서관", "책", "서재", "서가", "고서"],                           "library"),
    (["사원", "절", "신사", "한옥", "동양", "전통 건축", "벚꽃"],        "oriental"),
    (["연구소", "실험실", "과학", "첨단 시설"],                          "sci_lab"),
    (["지브리 골목", "골목길", "마을", "동네", "하이디"],                "ghibli_alley1"),
    (["스케치", "드로잉", "연필화", "소묘"],                             "sketch_landscape"),
    (["사무실", "오피스", "직장", "회사"],                               "office1"),
]

# ── 키워드 → 카메라 ID ─────────────────────────────────────────────────────
CAMERA_RULES: list[tuple[list[str], str]] = [
    (["드론", "항공", "하늘 위", "조감", "고공"],                        "drone"),
    (["크레인", "부드럽게 이동", "스윕"],                                "crane"),
    (["올려다", "아래에서", "압도적", "웅장한 스케일"],                  "low"),
    (["내려다", "위에서", "전체 조망", "하이앵글"],                      "high"),
    (["클로즈업", "얼굴 근접", "표정 강조"],                             "cu"),
    (["1인칭", "눈앞", "주인공 시점", "내 눈으로"],                      "pov"),
]

# ── ② Negative 프롬프트 — 공통 (모든 화풍) ───────────────────────────────
_NEGATIVE_RULES = """\

ABSOLUTE PROHIBITIONS (never generate any of the following):
✗ TEXT: no letters, words, sentences, numbers, digits, symbols, labels, titles, captions, watermarks, or copyright marks of any kind — not even decorative glyphs
✗ UI ELEMENTS: no buttons, menus, forms, inputs, checkboxes, progress bars, loading spinners, or any interactive component
✗ EXTERNAL RESOURCES: no <img> tags, no background-image URLs, no CDN links, no @import, no fetch() calls — 100% self-contained
✗ FEATURELESS BACKGROUNDS: never render a single flat solid color covering the entire canvas — always use gradients, layered elements, or atmospheric depth (light and bright palettes are fine as long as they have visual texture and depth)
✗ EMPTY AREAS: every region of the 1920×1080 canvas must contain depth, gradient, or animated visual elements — no dead zones with zero visual interest
✗ OVERFLOW / SCROLLBAR: html and body must never produce scrollbars — use overflow:hidden on both\
"""

# ── 화풍별 추가 Negative (style-specific) ────────────────────────────────
_STYLE_NEGATIVES: dict[str, str] = {
    "neo-noir":       "✗ Bright cheerful colors, pastel tones, rainbow elements, or high-saturation warmth",
    "ink-wash":       "✗ Photorealistic textures, neon/electric colors, digital glitch effects, or 3D shading",
    "pop-art":        "✗ Realistic gradients, soft blurs, cinematic depth-of-field, or photographic realism",
    "sticker-cutout": "✗ Dark/gloomy atmospheres, heavy shadows, horror elements, or desaturated palettes",
    "ghibli-night":   "✗ Bright daylight scenes, harsh direct sunlight, or clinical white lighting",
    "hollywood-sf":   "✗ Cute/childish elements, pastel colors, or low-tech environments",
    "anime-sf":       "✗ Realistic textures, muted earth tones, or non-cyberpunk environments",
    "pixar-3d":       "✗ Dark/horror atmospheres, gritty realism, or adult-themed gloomy environments",
    "reality":        "✗ Cartoon styles, exaggerated colors, anime aesthetics, or fantasy elements",
    "sticker-cutout": "✗ Dark/gloomy atmospheres, heavy shadows, or complex realistic textures",
}

# ── HTML 생성 공통 규칙 ────────────────────────────────────────────────────
_HTML_RULES = """\

MANDATORY HTML RULES:
• html, body { margin:0; padding:0; overflow:hidden; width:1920px; height:1080px; }
• All CSS animations must loop infinitely and seamlessly
• Fully self-contained — no external URLs, CDN links, img tags, or @import
• Use layered elements: background gradient → mid scene → foreground detail → atmospheric overlay
• Canvas or SVG for particle systems, morphing shapes, or dynamic effects
• Output ONLY the complete HTML document, opening the code block with ```html\
"""

# ── ⑤ 마스터 팔레트 (씬 간 색상 일관성) ──────────────────────────────────
# 화풍별 고정 팔레트 — 모든 씬이 동일한 색상 계열을 유지하도록 강제
# 구조: {style_id: [(role, hex), ...]}
MASTER_PALETTES: dict[str, list[tuple[str, str]]] = {
    "style8": [   # ghibli-real (지브리+실사)
        ("base",       "#FFF8E7"),   # 크림 배경
        ("primary",    "#F4A261"),   # 황금 앰버
        ("secondary",  "#52B788"),   # 싱그러운 초록
        ("sky",        "#A8DADC"),   # 하늘 청색
        ("shadow",     "#1D3557"),   # 인디고 그림자
    ],
    "style9": [   # hollywood-sf (시네마틱)
        ("base",       "#0D0D0D"),   # 시네마틱 블랙
        ("primary",    "#4A7FA5"),   # 스틸 블루
        ("highlight",  "#D4A017"),   # 황금 하이라이트
        ("smoke",      "#8B9EB7"),   # 스모크 그레이
        ("accent",     "#E8C97A"),   # 웜 골드
    ],
    "style5": [   # neo-noir (네오 누아르)
        ("base",       "#0A0A0A"),   # 오브시디언 블랙
        ("primary",    "#C1121F"),   # 스칼렛 레드
        ("highlight",  "#FFFFFF"),   # 퓨어 화이트
        ("shadow",     "#2D2D2D"),   # 딥 그레이
        ("accent",     "#6D0000"),   # 다크 크림슨
    ],
    "style13": [  # anime-sf (애니 SF)
        ("base",       "#10002B"),   # 딥 바이올렛
        ("primary",    "#FF006E"),   # 핫 핑크
        ("secondary",  "#00FFFF"),   # 네온 사이언
        ("accent",     "#FF9E00"),   # 선셋 피치
        ("glow",       "#7B2FBE"),   # 퍼플 글로우
    ],
    "style7": [   # ink-wash (수묵화)
        ("base",       "#F5F0E8"),   # 아이보리 종이
        ("ink",        "#1A1008"),   # 먹 블랙
        ("mist",       "#EDF2F4"),   # 안개 흰색
        ("mountain",   "#6B705C"),   # 산 그레이
        ("accent",     "#3D2B1F"),   # 짙은 갈색
    ],
    "style3": [   # pixar-3d (픽사 3D)
        ("sky",        "#87CEEB"),   # 하늘 블루
        ("sun",        "#FFD60A"),   # 선샤인 옐로우
        ("grass",      "#57CC99"),   # 풀 그린
        ("base",       "#FFFDF7"),   # 따뜻한 화이트
        ("shadow",     "#C9A84C"),   # 황금 그림자
    ],
    "style6": [   # reality (실사 다큐)
        ("gold",       "#D4A017"),   # 황금 앰버
        ("shadow",     "#3D1C02"),   # 딥 셰도우
        ("sky",        "#4A90D9"),   # 하늘 블루
        ("nature",     "#2D6A4F"),   # 자연 그린
        ("earth",      "#8D5524"),   # 흙 브라운
    ],
    "style11": [  # pop-art (팝아트)
        ("red",        "#E63946"),   # 프라이머리 레드
        ("yellow",     "#FFD60A"),   # 일렉트릭 옐로우
        ("blue",       "#003566"),   # 로열 블루
        ("white",      "#FFFFFF"),   # 퓨어 화이트
        ("outline",    "#1A1A2E"),   # 하드 아웃라인
    ],
    "style2": [   # sticker-cutout (스티커 컷아웃)
        ("mint",       "#B7E4C7"),   # 파스텔 민트
        ("lavender",   "#E0AAFF"),   # 소프트 라벤더
        ("peach",      "#FFCBA4"),   # 웜 피치
        ("sky",        "#ADE8F4"),   # 스카이 블루
        ("base",       "#FFFFFF"),   # 화이트 베이스
    ],
}

# 하위 호환: 기존 코드가 _COLOR_PALETTE 참조 시 사용
_COLOR_PALETTE: dict[str, str] = {
    sid: "  ".join(f"{r}: {h}" for r, h in colors)
    for sid, colors in MASTER_PALETTES.items()
}


def _build_color_rule(si_style_id: str) -> str:
    """
    마스터 팔레트 → HTML 색상 강제 규칙 문자열 생성.
    모든 씬에 동일하게 적용 → 씬 간 색상 일관성 보장.
    """
    palette = MASTER_PALETTES.get(si_style_id)
    if not palette:
        return ""
    color_list = "  ".join(f"{role}: {hex_val}" for role, hex_val in palette)
    return (
        f"COLOR MASTER CONSTRAINT — use ONLY these exact hex colors across ALL layers:\n"
        f"{color_list}\n"
        f"Every gradient, shape, particle, and glow must derive exclusively from this palette. "
        f"No other hues or tones allowed — strict adherence ensures visual consistency across all scenes."
    )

# ── 카메라 → HTML 구성 힌트 ───────────────────────────────────────────────
_CAMERA_TO_HTML: dict[str, str] = {
    "ws":    "Composition: wide panoramic layout, subject centered in mid-ground with expansive environment",
    "crane": "Composition: sweeping wide view, strong horizontal depth layers from foreground to far horizon",
    "drone": "Composition: aerial top-down perspective, environment fills the entire canvas from above",
    "low":   "Composition: low-angle perspective, subject towers upward, sky dominates upper portion",
    "high":  "Composition: elevated bird's-eye composition, looking downward, environment spread below",
    "cu":    "Composition: tight central focus, subject fills 70% of canvas, blurred edges, intimate framing",
    "pov":   "Composition: first-person immersive view, environment surrounds the viewer on all sides",
    "ms":    "Composition: medium balanced framing, equal weight between subject and environment",
    "fs":    "Composition: full-body to full-scene scale, complete environment visible with clear depth",
    "bird":  "Composition: close overhead top-down, intimate downward perspective from just above",
    "eye":   "Composition: neutral eye-level horizon, natural human perspective, balanced and grounded",
    "dutch": "Composition: tilted horizon line creating dynamic tension, diagonal energy through frame",
    "ots":   "Composition: depth-of-field scene with foreground element, leading the eye into distance",
}


def _load_styleimage() -> dict:
    raw = json.loads(STYLEIMAGE_JSON.read_text(encoding="utf-8"))
    result = {}
    for key in ("styles", "cameras", "lighting", "quality"):
        result[key] = {item["id"]: item for item in raw.get(key, [])}
    result["backgrounds"] = {item["id"]: item for item in raw.get("backgrounds", [])}
    return result


def _keyword_match(text: str, rules: list[tuple[list[str], str]], default: str) -> str:
    text_lower = text.lower()
    for keywords, result_id in rules:
        if any(kw in text_lower for kw in keywords):
            return result_id
    return default


def select_params(
    scene_text: str,
    art_style_id: str,
    styleimage: dict,
    emotion_id: str | None = None,
) -> dict:
    """
    씬 텍스트 + 화풍 ID + 감정 ID → 최적 파라미터 선택.

    우선순위:
    1. 큐레이션 프리셋 (art_style × emotion) — 검증된 최적 조합
    2. 감정 단독 폴백 (emotion만 있고 프리셋 없을 때)
    3. 씬 텍스트 키워드 매칭 (기존 방식)
    """
    si_style_id = STYLE_ID_MAP.get(art_style_id, "style9")
    style_obj = styleimage["styles"].get(si_style_id, list(styleimage["styles"].values())[0])

    # 1. 큐레이션 프리셋 우선 적용
    preset = CURATED_PRESETS.get((art_style_id, emotion_id)) if emotion_id else None
    if preset:
        lighting_id, bg_id, cam_id = preset
        source = "preset"
    # 2. 감정 단독 폴백
    elif emotion_id and emotion_id in EMOTION_LIGHTING:
        lighting_id = EMOTION_LIGHTING[emotion_id]
        bg_id       = EMOTION_BACKGROUND[emotion_id]
        cam_id      = EMOTION_CAMERA[emotion_id]
        source = "emotion"
    # 3. 키워드 매칭 (기존)
    else:
        lighting_id = _keyword_match(scene_text, LIGHTING_RULES, "")
        if not lighting_id:
            lighting_id = style_obj.get("recommend", "volumetric")
        excludes = style_obj.get("excludes", {}).get("lighting", [])
        if lighting_id in excludes:
            lighting_id = style_obj.get("recommend", "volumetric")
            if lighting_id in excludes:
                lighting_id = "volumetric"
        bg_id  = _keyword_match(scene_text, BACKGROUND_RULES, "studio")
        cam_id = _keyword_match(scene_text, CAMERA_RULES, "ws")
        source = "keyword"

    lighting_obj = styleimage["lighting"].get(lighting_id, styleimage["lighting"]["volumetric"])
    bg_obj       = styleimage["backgrounds"].get(bg_id, styleimage["backgrounds"].get("studio", list(styleimage["backgrounds"].values())[0]))
    cam_obj      = styleimage["cameras"].get(cam_id, styleimage["cameras"]["ws"])

    return {
        "style":      style_obj,
        "lighting":   lighting_obj,
        "camera":     cam_obj,
        "background": bg_obj,
        "source":     source,
    }


def build_opal_prompt(
    scene_text: str,
    art_style_id: str,
    emotion_id: str | None = None,
    tone_id: str | None = None,
) -> tuple[str, str]:
    """
    씬 텍스트 + 화풍 ID + 감정 ID + 톤 ID → (system_instruction, user_content).

    AI 개입 없음.

    핵심 변경: art_styles.json의 HTML 전용 system_instruction 사용.
    (content_styleimage.json val은 Stable Diffusion 프롬프트 → HTML 생성 부적합)

    Args:
        scene_text:    씬 설명 텍스트
        art_style_id:  화풍 ID (예: "ghibli-real")
        emotion_id:    감정 ID (예: "calm_warm") — 선택 사항
        tone_id:       톤앤매너 ID (예: "peaceful") — 선택 사항

    Returns:
        (system_instruction, user_content)
        → AppCatalyst API userInstruction / contents[0].text 에 직접 주입
    """
    # ── art_styles.json 로드 (HTML 전용 프롬프트) ──────────────────────────
    art_styles = json.loads(ART_STYLES_JSON.read_text(encoding="utf-8"))
    style_entry = art_styles.get(art_style_id) or art_styles.get("_default", {})

    base_system  = style_entry.get("system_instruction", "")
    scene_tmpl   = style_entry.get("scene_template", "Scene mood: {scene_text}")

    # ── 감정/톤 지시문 (base 뒤에 추가) ────────────────────────────────────
    emotion_block = f"\n{EMOTION_DIRECTIVE[emotion_id]}" if emotion_id in EMOTION_DIRECTIVE else ""
    tone_block    = f"\n{TONE_DIRECTIVE[tone_id]}"       if tone_id in TONE_DIRECTIVE       else ""

    # ── ② Negative (화풍별) ────────────────────────────────────────────────
    style_neg = _STYLE_NEGATIVES.get(art_style_id, "")
    neg_extra = f"\n✗ STYLE-SPECIFIC: {style_neg}" if style_neg else ""

    # ── system_instruction 최종 조합 ──────────────────────────────────────
    # base(art_styles.json) + emotion + tone + negative 추가분
    system_instruction = base_system + emotion_block + tone_block + neg_extra

    # ── user_content: scene_template + 감정 컨텍스트 ──────────────────────
    user_content = scene_tmpl.format(scene_text=scene_text)
    if emotion_id or tone_id:
        extras = []
        if emotion_id:
            extras.append(f"Emotional atmosphere: {emotion_id.replace('_', ' ')}")
        if tone_id:
            extras.append(f"Tone: {tone_id}")
        user_content += "\n\n" + " | ".join(extras)

    return system_instruction, user_content


def describe_selection(
    scene_text: str,
    art_style_id: str,
    emotion_id: str | None = None,
    tone_id: str | None = None,
) -> str:
    """선택된 파라미터 요약 출력 (디버그/로그용)."""
    styleimage = _load_styleimage()
    params = select_params(scene_text, art_style_id, styleimage, emotion_id)
    si_id = STYLE_ID_MAP.get(art_style_id, "?")
    lines = [
        f"  화풍:   {params['style']['label']} ({si_id})",
        f"  조명:   {params['lighting']['label']} ({params['lighting']['id']})",
        f"  카메라: {params['camera']['label']} ({params['camera']['id']})",
        f"  배경:   {params['background']['label']} ({params['background']['id']})",
        f"  선택방식: {params['source']}",
    ]
    if emotion_id:
        lines.append(f"  감정:   {emotion_id}")
    if tone_id:
        lines.append(f"  톤앤매너: {tone_id}")
    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════════
# A1-A → A1-B 파이프라인 (GEMINI 분석 → Opal HTML 생성)
# ══════════════════════════════════════════════════════════════════════════

# ── 화풍별 분위기 요약 (A1-B system_instruction용) ────────────────────────
_STYLE_FEEL: dict[str, tuple[str, str]] = {
    "ghibli-real":    ("Studio Ghibli",              "warm painterly pastoral — living watercolor"),
    "ghibli-night":   ("Studio Ghibli Night",        "magical nostalgic night — fireflies and moonlight"),
    "hollywood-sf":   ("Hollywood Sci-Fi",           "epic blockbuster scale — cosmic awe"),
    "neo-noir":       ("Neo-Noir",                   "moody urban tension — neon rain and shadow"),
    "ink-wash":       ("East Asian Ink-Wash",        "meditative stillness — brushwork and silence"),
    "pixar-3d":       ("Pixar 3D",                   "radiant optimism — warmth and wonder"),
    "reality":        ("Cinematic Documentary",      "BBC Planet Earth gravitas — breathtaking nature"),
    "anime-sf":       ("Japanese Anime Sci-Fi",      "vibrant bioluminescent energy — futuristic city"),
    "pop-art":        ("Pop Art",                    "bold graphic explosion — loud and confident"),
    "sticker-cutout": ("Sticker Cutout",             "playful pastel cuteness — bouncy and delightful"),
}

# ── A1-A: GEMINI 시스템 프롬프트 ─────────────────────────────────────────
A1A_SYSTEM_PROMPT = """\
당신은 영상 제작을 위한 씬 연출가입니다.
한국어 씬 설명을 받아 화가에게 그림을 의뢰하듯
풍부하고 감성적인 장면 묘사로 바꿔주세요.

규칙:
- 3~5문장 이내로 간결하게
- 좌표, 색상 코드, CSS, 기술적 용어 절대 사용 금지
- 영화 감독이 화가에게 말하듯 — 분위기, 빛, 공간감, 감정 중심
- 출력은 반드시 한국어\
"""


_EMOTION_KO: dict[str, str] = {
    "calm_warm":   "잔잔하고 따뜻함",
    "dramatic":    "극적이고 긴장감",
    "dark":        "어둡고 무거움",
    "energetic":   "활기차고 역동적",
    "mystical":    "신비롭고 몽환적",
    "nostalgic":   "그리움과 향수",
}
_TONE_KO: dict[str, str] = {
    "serious":       "진지하고 격식있는",
    "playful":       "가볍고 유쾌한",
    "inspirational": "감동적이고 도전적",
    "tense":         "긴박하고 긴장된",
    "peaceful":      "평화롭고 여유로운",
    "authoritative": "권위있고 전문적",
}
_STYLE_KO: dict[str, str] = {
    "ghibli-real":    "지브리 실사풍 — 따뜻하고 서정적인 수채화 느낌",
    "ghibli-night":   "지브리 야경 — 마법 같은 밤, 반딧불과 달빛",
    "hollywood-sf":   "할리우드 SF — 웅장하고 압도적인 우주적 스케일",
    "neo-noir":       "네오 누아르 — 빗젖은 도시, 네온 빛 그림자",
    "ink-wash":       "수묵화풍 — 먹과 여백의 고요한 동양 미학",
    "pixar-3d":       "픽사 3D — 밝고 따뜻한 생동감",
    "reality":        "실사 다큐풍 — BBC 자연다큐 수준의 장엄한 현실감",
    "anime-sf":       "일본 애니 SF — 화려한 미래도시와 생체발광",
    "pop-art":        "팝아트 — 강렬한 원색과 그래픽 에너지",
    "sticker-cutout": "스티커 컷아웃 — 파스텔 톤의 귀엽고 발랄한 세계",
}


def build_a1a_user(
    scene_text: str,
    art_style_id: str,
    emotion_id: str | None = None,
    tone_id: str | None = None,
) -> str:
    """A1-A GEMINI 호출용 user 메시지 조합."""
    style_desc = _STYLE_KO.get(art_style_id, "시네마틱 영상 스타일")
    parts = [
        f"씬: {scene_text}",
        f"화풍: {style_desc}",
    ]
    if emotion_id:
        parts.append(f"감정: {_EMOTION_KO.get(emotion_id, emotion_id)}")
    if tone_id:
        parts.append(f"톤: {_TONE_KO.get(tone_id, tone_id)}")
    return "\n".join(parts)


async def call_a1a(
    scene_text: str,
    art_style_id: str,
    emotion_id: str | None = None,
    tone_id: str | None = None,
    api_key: str | None = None,
) -> str:
    """
    A1-A: GEMINI Flash로 씬 → 비주얼 스펙 변환.

    Args:
        api_key: GOOGLE_API_KEY (None이면 환경변수에서 로드)

    Returns:
        비주얼 스펙 문자열 (A1-B user_content에 주입)
    """
    import os
    import httpx

    key = api_key or os.environ.get("GOOGLE_API_KEY", "")
    if not key:
        raise ValueError("GOOGLE_API_KEY가 없습니다.")

    user_msg = build_a1a_user(scene_text, art_style_id, emotion_id, tone_id)

    body = {
        "system_instruction": {"parts": [{"text": A1A_SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": user_msg}]}],
        "generationConfig": {"temperature": 0.3},
    }

    url = (
        "https://generativelanguage.googleapis.com/v1beta"
        f"/models/gemini-2.5-flash:generateContent?key={key}"
    )
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, json=body)
        resp.raise_for_status()

    return resp.json()["candidates"][0]["content"]["parts"][0]["text"]


def build_a1b_prompts(
    a1a_output: str,
    art_style_id: str,
) -> tuple[str, str]:
    """
    A1-B: A1-A 씬 묘사 → Opal Generator (system_instruction, user_content).

    Returns:
        (system_instruction, user_content)
        → AppCatalyst API userInstruction / contents[0].text 에 직접 주입
    """
    style_desc = _STYLE_KO.get(art_style_id, "시네마틱 영상 스타일")

    system_instruction = (
        f"당신은 영상 제작 전문 프론트엔드 개발자입니다.\n"
        f"아래 씬 묘사를 보고 {style_desc} 스타일의 "
        f"애니메이션 HTML 배경 (1920×1080)을 만드세요.\n"
        f"씬 묘사에 충실하게 — 분위기, 색감, 시간대를 그대로 표현하세요.\n\n"
        f"규칙:\n"
        f"- 화면에 글자, 숫자, 기호 절대 표시 금지\n"
        f"- 외부 URL, CDN, img 태그, @import 사용 금지\n"
        f"- html, body {{ margin:0; padding:0; overflow:hidden; width:1920px; height:1080px; }}\n"
        f"- 모든 애니메이션은 무한 반복\n"
        f"- ```html 로 시작하는 완성된 HTML만 출력"
    )

    user_content = f"씬 묘사:\n{a1a_output}"

    return system_instruction, user_content


async def build_opal_prompt_v2(
    scene_text: str,
    art_style_id: str,
    emotion_id: str | None = None,
    tone_id: str | None = None,
    api_key: str | None = None,
) -> tuple[str, str]:
    """
    A1-A → A1-B 파이프라인 통합 함수.

    GEMINI Flash로 씬 분석 → Opal Generator 프롬프트 조합.

    Returns:
        (system_instruction, user_content) — AppCatalyst API에 직접 주입
    """
    print("  [A1-A] GEMINI 씬 분석 중...", end="", flush=True)
    a1a_output = await call_a1a(scene_text, art_style_id, emotion_id, tone_id, api_key)
    print(f" 완료 ({len(a1a_output)}자)")
    return build_a1b_prompts(a1a_output, art_style_id)


# ── 직접 실행 시 테스트 ────────────────────────────────────────────────────
if __name__ == "__main__":
    tests = [
        # (scene_text, art_style_id, emotion_id, tone_id)
        ("혈압을 낮추는 시니어 건강 식품 TOP5",    "ghibli-real",  "calm_warm",  "peaceful"),
        ("사이버펑크 도시의 야경과 네온 빛",        "anime-sf",     "energetic",  "tense"),
        ("황혼 속 조용한 수묵화 산수 풍경",         "ink-wash",     "nostalgic",  "peaceful"),
        ("심우주를 항해하는 우주선의 웅장한 전경",  "hollywood-sf", "dramatic",   "authoritative"),
        ("폭우가 쏟아지는 누아르 도시 골목",        "neo-noir",     "dark",       "serious"),
        # 감정 없음 → 키워드 매칭 폴백
        ("황혼의 빛이 물드는 대나무 숲",            "ghibli-real",  None,         None),
    ]
    for scene, style, emotion, tone in tests:
        print(f"\n{'='*60}")
        print(f"씬:    {scene}")
        print(f"화풍:  {style}  감정: {emotion}  톤: {tone}")
        print(describe_selection(scene, style, emotion, tone))
        sys_inst, usr_cont = build_opal_prompt(scene, style, emotion, tone)
        print(f"  system_instruction: {len(sys_inst)}자")
        print(f"  user_content:       {len(usr_cont)}자")
