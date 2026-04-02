import base64
import os
import pathlib
from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel
from dotenv import load_dotenv

from services.gemini_image import generate_image

load_dotenv()

router = APIRouter(prefix="/api/v1/image", tags=["Image"])

OUTPUT_ROOT = pathlib.Path(r"C:\LinkDropV2\output")

ERROR_CODES = [
    "INVALID_API_KEY",
    "RATE_LIMIT",
    "NO_IMAGE_GENERATED",
    "GENERATION_FAILED",
]


class ImageGenerateRequest(BaseModel):
    prompt: str
    negative: str = ""
    api_key: str = ""
    aspect_ratio: str = "16:9"
    output_folder: str = ""   # e.g. "20260402_143022_16x9"
    scene_num: int = 0        # 1-based scene number (0 = skip save)
    character_image_base64: str = ""
    character_image_mime: str = "image/png"


class ImageGenerateResponse(BaseModel):
    success: bool
    image_base64: str = ""
    mime_type: str = ""
    saved_path: str = ""
    error: str = ""
    detail: str = ""


def _parse_error_code(msg: str) -> tuple[str, str]:
    """ValueError 메시지에서 'CODE: detail' 형태 파싱."""
    for code in ERROR_CODES:
        prefix = f"{code}:"
        if msg.startswith(prefix):
            return code, msg[len(prefix):].strip()
    return "GENERATION_FAILED", msg


def _save_image(output_folder: str, scene_num: int, raw_bytes: bytes, mime_type: str) -> str:
    """output/{folder}/images/imgN.ext 로 저장, 경로 반환."""
    ext = "jpg" if "jpeg" in mime_type or "jpg" in mime_type else "png"
    images_dir = OUTPUT_ROOT / output_folder / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    out_path = images_dir / f"img{scene_num}.{ext}"
    out_path.write_bytes(raw_bytes)
    return str(out_path)


@router.post("/generate", response_model=ImageGenerateResponse)
async def generate_image_endpoint(req: ImageGenerateRequest):
    """Gemini 이미지 생성. HTTP status 200, success 필드로 성공/실패 구분."""
    effective_key = req.api_key.strip() or os.getenv("GOOGLE_API_KEY", "")

    try:
        char_bytes = base64.b64decode(req.character_image_base64) if req.character_image_base64 else None
        raw_bytes, mime_type = await generate_image(
            prompt=req.prompt,
            negative=req.negative,
            api_key=effective_key,
            aspect_ratio=req.aspect_ratio,
            character_image_bytes=char_bytes,
            character_image_mime=req.character_image_mime or "image/png",
        )
        image_base64 = base64.b64encode(raw_bytes).decode("utf-8")

        saved_path = ""
        if req.output_folder and req.scene_num > 0:
            saved_path = _save_image(req.output_folder, req.scene_num, raw_bytes, mime_type)

        return ImageGenerateResponse(
            success=True,
            image_base64=image_base64,
            mime_type=mime_type,
            saved_path=saved_path,
        )
    except ValueError as e:
        code, detail = _parse_error_code(str(e))
        return ImageGenerateResponse(
            success=False,
            error=code,
            detail=detail,
        )
    except Exception as e:
        return ImageGenerateResponse(
            success=False,
            error="GENERATION_FAILED",
            detail=str(e),
        )


@router.post("/save")
async def save_image_endpoint(
    file: UploadFile = File(...),
    output_folder: str = Form(...),
    scene_num: int = Form(...),
):
    """업로드된 이미지를 output 폴더에 저장 (교체용)."""
    try:
        raw_bytes = await file.read()
        mime_type = file.content_type or "image/png"
        saved_path = _save_image(output_folder, scene_num, raw_bytes, mime_type)
        return {"success": True, "saved_path": saved_path}
    except Exception as e:
        return {"success": False, "detail": str(e)}


@router.delete("/scene/{output_folder}/{scene_num}")
async def delete_scene_image(output_folder: str, scene_num: int):
    """저장된 씬 이미지 파일 삭제."""
    try:
        images_dir = OUTPUT_ROOT / output_folder / "images"
        deleted = []
        for ext in ("png", "jpg", "jpeg"):
            p = images_dir / f"img{scene_num}.{ext}"
            if p.exists():
                p.unlink()
                deleted.append(str(p))
        return {"success": True, "deleted": deleted}
    except Exception as e:
        return {"success": False, "detail": str(e)}
