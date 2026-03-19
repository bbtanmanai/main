import sys
import httpx
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List

# skill-3-opalvideo 독립 인증 모듈 로드
_SKILL_PATH = Path("C:/LinkDropV2/packages/tools/skill-3-opalvideo/opal-access")
if str(_SKILL_PATH) not in sys.path:
    sys.path.insert(0, str(_SKILL_PATH))
from opal_auth import OpalAuthManager as _OpalAuthManager
opal_auth_manager = _OpalAuthManager()

logger = logging.getLogger(__name__)

class OpalInternalClient:
    """Opal(Google 호스팅)의 내부 요청을 모사하는 세션 기반 클라이언트"""
    BASE_URL = "https://opal.google" 
    # [1차 타깃] 링크드랍 롱폼 제작기 편집실
    APP_URL = "https://opal.google/edit/1YQTJjGO0VnQN5U38CE6hHNIhbcindUXt"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=60.0) # 롱폼 렌더링을 위해 타임아웃 확장


    async def _get_headers(self) -> Dict[str, str]:
        session = opal_auth_manager.load_session()
        if not session or not session.cookies:
            raise Exception("Opal 세션이 없습니다. opal_login.bat을 먼저 실행해주세요.")

        token = opal_auth_manager.ensure_token()
        headers = {
            "Cookie": session.cookie_header,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Content-Type": "application/json",
            "Referer": self.APP_URL,
            "Origin": "https://opal.google",
        }
        if token:
            headers["Authorization"] = token
        return headers


    async def trigger_render(self, project_data: Dict[str, Any]) -> str:
        """
        Rule 104 준수 데이터를 오팔 내부 규격으로 변환하여 렌더링 트리거
        """
        headers = await self._get_headers()
        
        # TODO: 실제 오팔 웹앱의 네트워크 요청을 가로채어 알아낸 엔드포인트로 교체
        endpoint = f"{self.BASE_URL}/v1/render/start" 
        
        try:
            response = await self.client.post(endpoint, json=project_data, headers=headers)
            response.raise_for_status()
            result = response.json()
            logger.info(f"Opal 렌더링 트리거 성공: {result}")
            return result.get("job_id")
        except httpx.HTTPError as e:
            logger.error(f"Opal 렌더링 트리거 실패: {e}")
            raise Exception(f"오팔 서버와의 통신 중 오류가 발생했습니다: {e}")

    async def get_project_data(self) -> Dict[str, Any]:
        """현재 편집실(APP_URL)의 모든 노드 데이터와 설정을 가져옵니다."""
        headers = await self._get_headers()
        # 편집실 ID 추출
        project_id = self.APP_URL.split('/')[-1]
        endpoint = f"{self.BASE_URL}/v1/projects/{project_id}"
        
        try:
            response = await self.client.get(endpoint, headers=headers)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Opal 데이터 가져오기 실패: {e}")
            raise Exception(f"편집실 데이터를 읽어오는 중 오류가 발생했습니다: {e}")

    async def update_nodes(self, nodes_data: List[Dict[str, Any]]) -> bool:
        """수정된 노드 데이터를 오팔 엔진에 다시 투입(Update)합니다."""
        headers = await self._get_headers()
        project_id = self.APP_URL.split('/')[-1]
        endpoint = f"{self.BASE_URL}/v1/projects/{project_id}/nodes"
        
        try:
            response = await self.client.put(endpoint, json={"nodes": nodes_data}, headers=headers)
            response.raise_for_status()
            logger.info("Opal 노드 수정 성공")
            return True
        except httpx.HTTPError as e:
            logger.error(f"Opal 노드 수정 실패: {e}")
            return False

    async def generate_html_slide(
        self,
        intent: str,
        scene_text: str | None = None,
        user_instruction: str | None = None,
        model: str = "gemini-2.5-flash",
        app_id: str | None = None,
        debug: bool = False,
    ) -> str:
        """
        appcatalyst generateWebpageStream SSE로 HTML 슬라이드 생성.

        나노바나나 제너레이터 노드 방식:
          - intent: 화풍/스타일 지시 (고수준 컨텍스트)
          - scene_text: 실제 씬 내용 → contents[0].parts[0].text 로 전달
          - contents 를 채워야 API 가 정상 응답함 (빈 배열이면 생성 안됨)

        Args:
            intent:      화풍/스타일 설명 (Opal 제너레이터의 시스템 컨텍스트)
            scene_text:  씬 내용 텍스트 → Gemini contents[user] 에 주입
            user_instruction: 시스템 프롬프트 (None이면 시각 배경 전용 기본값 사용)
            model:       Gemini 모델 ID
            debug:       True 이면 raw SSE 청크를 stderr 에 출력

        Returns:
            완성된 HTML 문자열 (```html 블록 내부, 없으면 전체 raw)
        """
        import re
        import json as _json
        import sys as _sys

        token_header = opal_auth_manager.ensure_token() or ""
        access_token = token_header.removeprefix("Bearer ").strip()

        if not user_instruction:
            user_instruction = (
                "You are a professional motion graphic designer creating full-screen cinematic "
                "background visuals for video production. "
                "Generate a self-contained HTML page that fills exactly 1920×1080 pixels with "
                "a rich, visually stunning background — using CSS gradients, SVG shapes, "
                "canvas animations, or layered elements. "
                "CRITICAL RULES: "
                "1. NO text, NO labels, NO titles, NO captions anywhere on the page. "
                "2. The visual must evoke the mood/theme described by the user. "
                "3. Use deep, broadcast-quality colors (avoid washed-out or flat colors). "
                "4. The HTML must be entirely self-contained — no external URLs or CDN links. "
                "5. Body margin/padding = 0, overflow = hidden, width = 1920px, height = 1080px. "
                "Return only the code, opening the HTML codeblock with '```html'."
            )

        endpoint = "https://appcatalyst.pa.googleapis.com/v1beta1/generateWebpageStream?alt=sse"

        # 쿠키 로드 (AppCatalyst API는 쿠키 + Bearer 토큰 모두 필요)
        session = opal_auth_manager.load_session()
        cookie_header = session.cookie_header if session and session.cookies else ""

        # 브라우저 실제 요청 헤더 재현 (403 방지)
        headers = {
            "Authorization": token_header,
            "Content-Type": "application/json",
            "Referer": "https://opal.google/",
            "Origin": "https://opal.google",
            "x-browser-channel": "stable",
            "x-browser-copyright": "Copyright 2026 Google LLC. All Rights reserved.",
            "x-browser-validation": "mGtxj/IERUi4uQ9hLSvZZF4DQgA=",
            "x-browser-year": "2026",
            "x-client-data": "CIW2yQEIpbbJAQipncoBCNjeygEIlKHLAQiFoM0BCNKxzwEY6LHPARjIs88B",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }
        if cookie_header:
            headers["Cookie"] = cookie_header

        # 실제 브라우저 요청 구조 재현:
        #   intent = "" (빈 문자열)
        #   userInstruction = 테마 컬러 등 글로벌 지시
        #   contents[0].parts[0].text = 실제 생성 프롬프트
        #   contents[0].parts[0].partMetadata.input_name = "text_1"
        #   accessToken = Bearer 접두어 없는 토큰
        input_text = scene_text or intent
        body = {
            "intent": "",
            "modelName": model,
            "userInstruction": user_instruction or "",
            "contents": [
                {
                    "role": "user",
                    "parts": [{
                        "text": input_text,
                        "partMetadata": {"input_name": "text_1"},
                    }],
                }
            ],
            "accessToken": access_token,
        }

        full_text: list[str] = []
        raw_lines: list[str] = []
        async with httpx.AsyncClient(timeout=120.0) as stream_client:
            async with stream_client.stream("POST", endpoint, json=body, headers=headers) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if debug:
                        raw_lines.append(line)
                    if not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        data = _json.loads(data_str)
                        # AppCatalyst 실제 응답: {"parts": [{"text": "...", "partMetadata": {"chunk_type": "thought"}}]}
                        # thinking 블록(chunk_type="thought")은 건너뜀
                        for part in data.get("parts", []):
                            meta = part.get("partMetadata", {})
                            if meta.get("chunk_type") == "thought":
                                continue  # 사고 과정 제외
                            t = part.get("text", "")
                            if t:
                                full_text.append(t)
                        # 폴백: 기존 Gemini 포맷
                        if not full_text:
                            chunk = (
                                data.get("text")
                                or data.get("content")
                                or (
                                    data.get("candidates", [{}])[0]
                                        .get("content", {})
                                        .get("parts", [{}])[0]
                                        .get("text", "")
                                )
                            )
                            if chunk:
                                full_text.append(chunk)
                    except Exception:
                        raw_data = line[6:].strip()
                        if raw_data and raw_data != "[DONE]":
                            full_text.append(raw_data)

        if debug:
            print(f"[Opal DEBUG] SSE lines: {len(raw_lines)}, text chunks: {len(full_text)}",
                  file=_sys.stderr, flush=True)
            if raw_lines:
                print(f"[Opal DEBUG] first 3 lines: {raw_lines[:3]}", file=_sys.stderr, flush=True)

        raw = "".join(full_text)
        if debug:
            print(f"[Opal DEBUG] raw length={len(raw)}, preview={raw[:300]!r}",
                  file=_sys.stderr, flush=True)

        # ```html 코드블록 추출
        m = re.search(r"```html\s*([\s\S]*?)```", raw)
        if m:
            return m.group(1).strip()
        # HTML 태그가 있으면 바로 반환
        if "<html" in raw.lower() or "<!doctype" in raw.lower():
            return raw.strip()
        return raw.strip()

    async def execute_step_image(
        self,
        scene_text: str,
        aspect_ratio: str = "16:9",
        model: str = "gemini-3-pro-image-preview",
    ) -> tuple[str, str] | None:
        """
        executeStep API 로 AI 이미지 생성.

        Returns:
            (gcs_blob_path, proxy_url) tuple, 또는 실패 시 None.
            proxy_url = https://opal.google/board/blobs/{bucket}/{object}
        """
        import base64 as _b64

        token_header = opal_auth_manager.ensure_token() or ""
        session = opal_auth_manager.load_session()
        cookie_header = session.cookie_header if session and session.cookies else ""

        headers = {
            "Authorization": token_header,
            "Content-Type": "application/json",
            "Referer": "https://opal.google/",
            "Origin": "https://opal.google",
            "x-browser-channel": "stable",
            "x-browser-copyright": "Copyright 2026 Google LLC. All Rights reserved.",
            "x-browser-validation": "mGtxj/IERUi4uQ9hLSvZZF4DQgA=",
            "x-browser-year": "2026",
            "x-client-data": "CIW2yQEIpbbJAQipncoBCNjeygEIlKHLAQiFoM0BCNKxzwEY6LHPARjIs88B",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }
        if cookie_header:
            headers["Cookie"] = cookie_header

        body = {
            "planStep": {
                "stepName": "AI Image Tool",
                "modelApi": "ai_image_tool",
                "inputParameters": ["input_instruction"],
                "systemPrompt": "",
                "options": {"modelName": model, "disablePromptRewrite": True},
                "output": "generated_image",
            },
            "execution_inputs": {
                "input_instruction": {
                    "chunks": [{"mimetype": "text/plain",
                                "data": _b64.b64encode(scene_text.encode()).decode()}]
                },
                "aspect_ratio_key": {
                    "chunks": [{"mimetype": "text/plain",
                                "data": _b64.b64encode(aspect_ratio.encode()).decode()}]
                },
            },
        }

        endpoint = "https://appcatalyst.pa.googleapis.com/v1beta1/executeStep"
        try:
            async with httpx.AsyncClient(timeout=120.0) as c:
                resp = await c.post(endpoint, json=body, headers=headers)
                resp.raise_for_status()
                data = resp.json()
            img_chunks = (
                data.get("executionOutputs", {})
                    .get("generated_image", {})
                    .get("chunks", [])
            )
            if not img_chunks:
                return None
            raw_path = _b64.b64decode(img_chunks[0]["data"]).decode("utf-8")
            # raw_path 예: "labs-opal-prod-blobs/686eaead-..."
            proxy_url = f"https://opal.google/board/blobs/{raw_path}"
            return raw_path, proxy_url
        except Exception as e:
            logger.error(f"execute_step_image 실패: {e}")
            return None


    async def download_blob_image(
        self,
        proxy_url: str,
        output_path: Path,
    ) -> bool:
        """
        executeStep 결과로 받은 proxy_url 에서 이미지를 다운로드해 PNG로 저장.

        proxy_url 형식: https://opal.google/board/blobs/labs-opal-prod-blobs/{uuid}
        인증: Bearer 토큰 + 쿠키 (opal_client 공통 헤더 사용)
        """
        from pathlib import Path as _Path

        token_header = opal_auth_manager.ensure_token() or ""
        session = opal_auth_manager.load_session()
        cookie_header = session.cookie_header if session and session.cookies else ""

        headers = {
            "Authorization": token_header,
            "Referer": "https://opal.google/",
            "Origin": "https://opal.google",
            "x-browser-channel": "stable",
            "x-browser-copyright": "Copyright 2026 Google LLC. All Rights reserved.",
            "x-browser-validation": "mGtxj/IERUi4uQ9hLSvZZF4DQgA=",
            "x-browser-year": "2026",
            "x-client-data": "CIW2yQEIpbbJAQipncoBCNjeygEIlKHLAQiFoM0BCNKxzwEY6LHPARjIs88B",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }
        if cookie_header:
            headers["Cookie"] = cookie_header

        try:
            async with httpx.AsyncClient(timeout=60.0) as c:
                resp = await c.get(proxy_url, headers=headers, follow_redirects=True)
                resp.raise_for_status()
                _Path(output_path).parent.mkdir(parents=True, exist_ok=True)
                _Path(output_path).write_bytes(resp.content)
                logger.info(f"blob 다운로드 완료: {output_path} ({len(resp.content)//1024}KB)")
                return True
        except Exception as e:
            logger.error(f"blob 다운로드 실패: {e}")
            return False


opal_client = OpalInternalClient()
