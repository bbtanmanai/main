#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
시나리오 단건 생성기
--------------------
Step 1~2만 실행해 시나리오 텍스트를 JSON으로 반환합니다.
(렌더링·업로드 없음, 빠른 미리보기용)

출력:
  {"script": "[씬1] ...\n[씬2] ..."}
  {"error": "오류 메시지"}
"""
import sys
import json
import argparse
import os
from pathlib import Path

# 프로젝트 루트 .env 로드 (GOOGLE_API_KEY 등)
_ROOT_ENV = Path(__file__).parent.parent.parent.parent.parent / ".env"
if _ROOT_ENV.exists():
    for _line in _ROOT_ENV.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

sys.path.insert(0, str(Path(__file__).parent))

from logic import step1_get_script, PipelineJob  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--app",        default="health-senior")
    parser.add_argument("--topic",      required=True)
    parser.add_argument("--voice",      default="ko-KR-Wavenet-D")
    parser.add_argument("--style",      default="ranking")
    parser.add_argument("--art_prompt", default="")
    args = parser.parse_args()

    try:
        job = PipelineJob(app_id=args.app, topic=args.topic, voice=args.voice, style=args.style, art_prompt=args.art_prompt)
        script = step1_get_script(job)
        print(json.dumps({"script": script}, ensure_ascii=False), flush=True)
        return 0
    except RuntimeError as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False), flush=True)
        return 1
    except Exception as e:
        print(json.dumps({"error": f"예기치 않은 오류: {e}"}, ensure_ascii=False), flush=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
