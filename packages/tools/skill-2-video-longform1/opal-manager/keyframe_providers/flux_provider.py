#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FLUX Schnell 씬 배경 이미지 생성 프로바이더
Replicate API → flux-schnell → PNG

비용: $0.003/장, 씬 3개 = $0.009/영상
"""
import os, httpx, replicate
from pathlib import Path

# ── 화풍별 FLUX 프롬프트 (시각 요소 핵심만 추출) ──────────────────────────────
STYLE_FLUX_PROMPTS: dict[str, str] = {
    "ghibli-real": (
        "Studio Ghibli animated film background, cinematic 16:9 widescreen, "
        "warm golden-hour pastoral landscape, layered misty mountains, "
        "rolling green meadow with wildflowers, soft watercolor gradients, "
        "floating pollen particles, radial god-rays from upper left, "
        "cream and amber and teal sky color palette, "
        "no text, no people, no characters, highly detailed"
    ),
    "ghibli-night": (
        "Studio Ghibli magical night scene, cinematic 16:9 widescreen, "
        "deep indigo to black starry sky, 200 star field with twinkle, "
        "diagonal Milky Way band, large glowing full moon with soft halo, "
        "warm village silhouette with amber lit windows, "
        "green firefly glow particles drifting, reflection lake at bottom, "
        "deep indigo and star silver and warm amber palette, "
        "no text, no people, magical nostalgic atmosphere"
    ),
    "anime-sf": (
        "Japanese anime sci-fi city background, cinematic 16:9 widescreen, "
        "dramatic gradient sky deep violet to hot pink horizon, "
        "futuristic megacity silhouette with glowing windows, "
        "bioluminescent ground energy, holographic haze overlay, "
        "deep violet and hot pink and neon cyan palette, "
        "no text, no people, vibrant premium anime style"
    ),
    "pixar-3d": (
        "Pixar animated film background, cinematic 16:9 widescreen, "
        "bright warm sky blue gradient to golden horizon, "
        "large puffy volumetric clouds with soft drop-shadow, "
        "three layers rolling green hills with ambient occlusion, "
        "radial sun glow, light shafts, floating dust motes, "
        "sunshine yellow and grass green and sky blue palette, "
        "no text, no people, warm optimistic Pixar 3D render style"
    ),
    "reality": (
        "BBC Planet Earth cinematic documentary background, 16:9 widescreen, "
        "dramatic golden-hour directional amber light, "
        "detailed terrain silhouette across full width, "
        "atmospheric haze bands at horizon, deep sky gradient blue to gold, "
        "strong cinematic vignette, wide light ray shafts, "
        "golden amber and deep shadow brown and sky blue palette, "
        "no text, no people, photorealistic nature documentary"
    ),
    # ── 주제별 배경 ─────────────────────────────────────────────────────────────
    "health-senior-1": (
        "Warm healing morning background, cinematic 16:9 widescreen, "
        "soft cream to light green gradient sky, "
        "golden god-rays from upper left, gentle leaf silhouettes at edges, "
        "floating wellness particles drifting upward, warm light bloom, "
        "healing green and golden morning and cream white palette, "
        "no text, no people, serene nurturing atmosphere"
    ),
    "health-senior-2": (
        "Forest nature therapy background, cinematic 16:9 widescreen, "
        "three-depth forest tree silhouettes, sky blue gradient above, "
        "golden light shafts through forest canopy, "
        "falling leaves gently descending, morning mist at ground level, "
        "forest green and sky blue and earth gold palette, "
        "no text, no people, peaceful healing forest atmosphere"
    ),
    "tech-trend-1": (
        "Futuristic cyber technology background, cinematic 16:9 widescreen, "
        "deep navy space base with subtle grid lines, "
        "flowing data stream lines electric blue, floating hexagons, "
        "circuit trace network at bottom, particle field 120 dots, "
        "connection nodes with glow, single scan line traversing, "
        "deep navy and electric blue and neon cyan palette, "
        "no text, intelligent dynamic forward-looking"
    ),
    "tech-trend-2": (
        "Innovation lab technology background, cinematic 16:9 widescreen, "
        "dark indigo gradient base, central radial violet-white light burst, "
        "three concentric rings slowly rotating, geometric particle cluster, "
        "light beams from center, innovation spark points, blueprint grid faint, "
        "dark indigo and electric violet and bright white palette, "
        "no text, creative precise powerful atmosphere"
    ),
    "stock-news-1": (
        "Bull market financial background, cinematic 16:9 widescreen, "
        "near-black dark base, rising chart lines trending upward, "
        "golden particles rising from bottom, upward momentum energy, "
        "warm glow blooms in gold-green, candlestick silhouette at bottom edge, "
        "deep charcoal and gold and market green palette, "
        "no text, confident prosperous forward-moving atmosphere"
    ),
    "stock-news-2": (
        "Data analysis financial background, cinematic 16:9 widescreen, "
        "warm dark walnut base, amber data grid lines, "
        "flowing data streams varying width, bar chart silhouettes at bottom, "
        "scatter plot dots placed randomly, warm bokeh circles, "
        "deep walnut and amber and warm cream palette, "
        "no text, analytical warm-toned intellectual atmosphere"
    ),
    "wisdom-quotes-1": (
        "Zen meditation ink-wash background, cinematic 16:9 widescreen, "
        "warm ivory paper base, three-depth mountain silhouettes, "
        "drifting mist bands, water ripple expanding gently, "
        "abstract calligraphic brushstrokes, falling petals, distant pine, "
        "ivory and ink black and accent gold palette, "
        "no text no calligraphy no letters, stillness depth contemplative"
    ),
    "wisdom-quotes-2": (
        "Cosmic contemplation night sky background, cinematic 16:9 widescreen, "
        "deep purple-black space, 200 star field silver white, "
        "Milky Way arc diagonal, wisdom aurora gold and teal flowing waves, "
        "nebula bloom violet teal, cosmic particle stream gold-tinted, "
        "deep cosmos and star silver and wisdom gold palette, "
        "no text, vast humbling profound atmosphere"
    ),
    "lifestyle-1": (
        "Cozy warm lifestyle background, cinematic 16:9 widescreen, "
        "warm cream to peach radial gradient base, "
        "warm amber light bloom upper right, soft pastel bokeh circles, "
        "floating rounded comfort shapes gently bobbing, warm particle dust, "
        "warm coral and soft peach and cream white palette, "
        "no text, safe warm quietly joyful atmosphere"
    ),
    "lifestyle-2": (
        "Active nature lifestyle background, cinematic 16:9 widescreen, "
        "fresh sky blue to mint white gradient, "
        "teal green terrain waves at horizon two depth layers, "
        "morning light rays from upper left, diagonal breeze particles streaming, "
        "teal ripple water shimmer at bottom edge, "
        "teal and mint and sky blue and forest green palette, "
        "no text, alive invigorating fresh morning atmosphere"
    ),
    "news-anchor": (
        "Authoritative broadcast news studio background, cinematic 16:9 widescreen, "
        "deep navy to dark slate gradient base, "
        "horizontal cold-white light bars sweeping slowly across frame, "
        "fine silver perspective grid converging to vanishing point, "
        "signal-blue radar pulse rings expanding from left-center, "
        "dual studio spotlight cones from upper corners, "
        "strong dark vignette pulling focus to center, "
        "deep navy and steel blue and broadcast gold palette, "
        "no text, no people, authoritative credible news broadcast atmosphere"
    ),
    "economy-global": (
        "Global economy world data background, cinematic 16:9 widescreen, "
        "deep ocean navy base suggesting earth curvature, "
        "latitude longitude world grid lines silver drifting eastward, "
        "great-circle arc trade routes in data blue and gold, "
        "16 glowing connection nodes pulsing at grid intersections, "
        "gold capital flow streams horizontal across frame, "
        "subtle globe edge arc at lower right, "
        "deep ocean navy and globe silver and data blue and gold flow palette, "
        "no text, no people, vast interconnected global financial atmosphere"
    ),
    "_default": (
        "Premium cinematic animated background, 16:9 widescreen, "
        "deep gradient layers with volumetric haze, floating light particles, "
        "dramatic light beam from upper corner, bokeh elements, "
        "strong dark vignette edges, atmospheric depth, "
        "midnight blue and deep teal and gold highlight palette, "
        "no text, no people, high-end broadcast quality"
    ),
}


def build_flux_prompt(art_style_id: str, scene_text: str = "") -> str:
    """화풍 ID + 씬 텍스트 → FLUX 프롬프트"""
    base = STYLE_FLUX_PROMPTS.get(art_style_id, STYLE_FLUX_PROMPTS["_default"])
    if scene_text:
        return f"{base}, mood inspired by: {scene_text}"
    return base


def generate_scene_bg(
    art_style_id: str,
    scene_index: int,
    out_dir: str | Path,
    scene_text: str = "",
    seed: int = 42,
    api_token: str | None = None,
) -> str:
    """
    FLUX Schnell로 씬 배경 이미지 생성.

    Args:
        art_style_id: 화풍 ID (예: "ghibli-real")
        scene_index:  씬 번호 (파일명용)
        out_dir:      저장 디렉토리
        scene_text:   씬 설명 텍스트 (프롬프트 추가)
        seed:         재현성용 시드 (기본 42)
        api_token:    Replicate API 토큰 (None이면 환경변수)

    Returns:
        저장된 PNG 파일 절대 경로
    """
    token = api_token or os.environ.get("REPLICATE_API_TOKEN", "")
    if not token:
        raise ValueError("REPLICATE_API_TOKEN이 없습니다.")

    os.environ["REPLICATE_API_TOKEN"] = token

    prompt = build_flux_prompt(art_style_id, scene_text)
    out_path = Path(out_dir) / f"scene_{scene_index:02d}_bg.png"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    output = replicate.run(
        "black-forest-labs/flux-schnell",
        input={
            "prompt": prompt,
            "width": 1920,
            "height": 1080,
            "num_outputs": 1,
            "num_inference_steps": 4,
            "output_format": "png",
            "seed": seed + scene_index,  # 씬마다 다른 구도
        }
    )

    url = str(output[0]) if isinstance(output, list) else str(output)
    img_bytes = httpx.get(url, timeout=30).content
    out_path.write_bytes(img_bytes)
    return str(out_path)


def generate_all_scene_bgs(
    art_style_id: str,
    scene_count: int,
    out_dir: str | Path,
    scenes: list[dict] | None = None,
    seed: int = 42,
    api_token: str | None = None,
) -> list[str]:
    """
    씬 전체 배경 이미지 일괄 생성.

    Args:
        art_style_id: 화풍 ID
        scene_count:  씬 수 (기본 3)
        out_dir:      저장 디렉토리
        scenes:       씬 데이터 리스트 (text 필드 사용)
        seed:         기본 시드

    Returns:
        PNG 파일 경로 리스트
    """
    paths = []
    for i in range(scene_count):
        scene_text = ""
        if scenes and i < len(scenes):
            scene_text = scenes[i].get("text", "")

        print(f"  [FLUX] 씬{i} 배경 생성 중...", end="", flush=True)
        try:
            path = generate_scene_bg(
                art_style_id=art_style_id,
                scene_index=i,
                out_dir=out_dir,
                scene_text=scene_text,
                seed=seed,
                api_token=api_token,
            )
            print(f" 완료")
            paths.append(path)
        except Exception as e:
            print(f" ❌ {e}")
            paths.append("")

    return paths


# ── 직접 실행 시 테스트 ─────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    ROOT = Path(__file__).parent.parent.parent.parent.parent.parent
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

    OUT = ROOT / "tmp" / "flux_test_3scenes"

    STYLE = sys.argv[1] if len(sys.argv) > 1 else "ghibli-real"
    SCENES = [
        {"text": "AI가 우리의 일상을 바꾸고 있습니다"},
        {"text": "생성형 AI는 이제 글쓰기와 영상 제작을 대신합니다"},
        {"text": "AI를 먼저 활용하는 사람이 미래를 주도합니다"},
    ]

    print(f"[테스트] 화풍={STYLE}, 씬={len(SCENES)}개\n")
    paths = generate_all_scene_bgs(
        art_style_id=STYLE,
        scene_count=len(SCENES),
        out_dir=OUT,
        scenes=SCENES,
    )
    print(f"\n결과:")
    for p in paths:
        print(f"  {p}")

    import subprocess
    for p in paths:
        if p:
            subprocess.Popen(["cmd", "/c", "start", "", p])
