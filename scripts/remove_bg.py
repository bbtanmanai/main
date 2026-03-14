#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
배경 제거 스크립트 (rembg)
--------------------------
입력: 원본 이미지 경로
출력: 투명 PNG 저장 경로 (JSON)

사용: python remove_bg.py --input /path/to/image.jpg --output /path/to/out.png
"""
import sys
import json
import argparse
from pathlib import Path

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input",  required=True, help="원본 이미지 경로")
    parser.add_argument("--output", required=True, help="출력 PNG 경로")
    args = parser.parse_args()

    input_path  = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(json.dumps({"error": f"파일 없음: {input_path}"}), flush=True)
        return 1

    try:
        from rembg import remove
        from PIL import Image

        with open(input_path, "rb") as f:
            raw = f.read()

        result_bytes = remove(raw)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(result_bytes)

        # 결과 이미지 크기 확인
        from io import BytesIO
        img = Image.open(BytesIO(result_bytes))
        w, h = img.size

        print(json.dumps({
            "ok":     True,
            "output": str(output_path),
            "width":  w,
            "height": h,
        }, ensure_ascii=False), flush=True)
        return 0

    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
