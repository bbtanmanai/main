import asyncio
from google import genai
from google.genai import types


async def generate_image(
    prompt: str,
    negative: str,
    api_key: str,
    aspect_ratio: str = "16:9",
    character_image_bytes: bytes | None = None,
    character_image_mime: str = "image/png",
) -> tuple[bytes, str]:
    """
    Gemini 이미지 생성.

    Returns: (raw_bytes, mime_type)
    Raises: ValueError with error_code prefix
    """
    if not api_key:
        raise ValueError("INVALID_API_KEY: API 키가 없습니다.")

    full_prompt = prompt.strip()
    if negative:
        full_prompt += f"\n\nAvoid: {negative.strip()}"

    def _call() -> tuple[bytes, str]:
        try:
            from google.api_core.exceptions import PermissionDenied, ResourceExhausted

            client = genai.Client(api_key=api_key)

            QUALITY_SUFFIX = (
                " Single cohesive scene, no text overlays, no watermarks, "
                "no split panels, no collage, no borders."
            )

            if character_image_bytes:
                char_instruction = (
                    f"Generate this exact scene as a single high-quality image:\n\n{full_prompt}\n\n"
                    "The attached image is a CHARACTER APPEARANCE REFERENCE only. "
                    "Use it solely to accurately draw the character's face, hair, clothing, and visual style "
                    "when placing them inside the scene described above. "
                    "The reference image must NOT influence the background, composition, or layout — "
                    "the scene description fully controls the image structure. "
                    "The character is one natural figure within the scene, not the entire image."
                    + QUALITY_SUFFIX
                )
                contents = [
                    types.Part.from_bytes(data=character_image_bytes, mime_type=character_image_mime),
                    types.Part.from_text(text=char_instruction),
                ]
            else:
                contents = (
                    f"Generate this exact scene as a single high-quality image:\n\n{full_prompt}"
                    + QUALITY_SUFFIX
                )

            response = client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=contents,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                    image_config=types.ImageConfig(aspect_ratio=aspect_ratio),
                ),
            )

            candidates = response.candidates or []
            text_parts = []
            for cand in candidates:
                if not cand.content:
                    continue
                for part in cand.content.parts:
                    inline = getattr(part, "inline_data", None)
                    if inline and inline.data:
                        # inline.data 는 raw bytes — base64.b64decode 절대 금지
                        return inline.data, inline.mime_type
                    text_val = getattr(part, "text", None)
                    if text_val:
                        text_parts.append(text_val[:200])

            detail = " | ".join(text_parts) if text_parts else f"candidates={len(candidates)}"
            raise ValueError(f"NO_IMAGE_GENERATED: 이미지 파트가 응답에 없습니다. ({detail})")

        except ValueError:
            raise
        except Exception as e:
            # google.api_core.exceptions 는 동적 임포트 이후에만 사용 가능하므로
            # 문자열 클래스명으로 분기
            cls_name = type(e).__name__
            err_str = str(e)
            if cls_name == "PermissionDenied" or "PermissionDenied" in str(type(e)) or "API_KEY_INVALID" in err_str or "API key not valid" in err_str:
                raise ValueError(f"INVALID_API_KEY: {e}")
            if cls_name == "ResourceExhausted" or "ResourceExhausted" in str(type(e)) or "RATE_LIMIT" in err_str or "quota" in err_str.lower():
                raise ValueError(f"RATE_LIMIT: {e}")
            raise ValueError(f"GENERATION_FAILED: {e}")

    try:
        return await asyncio.to_thread(_call)
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"GENERATION_FAILED: {e}")
