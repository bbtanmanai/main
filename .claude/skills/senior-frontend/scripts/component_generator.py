#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
컴포넌트 생성기 (component_generator.py)
Next.js + TypeScript 컴포넌트 보일러플레이트를 자동 생성합니다.
"""

import os
import sys
import argparse
from pathlib import Path

# Windows UTF-8 출력
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

SERVER_COMPONENT_TEMPLATE = '''\
import type {{ Metadata }} from "next";

interface {name}Props {{
  // Props 정의
}}

export default function {name}({{ }}: {name}Props) {{
  return (
    <section className="ld-glass rounded-xl p-6">
      <h2 className="text-2xl font-bold text-primary">{name}</h2>
    </section>
  );
}}
'''

CLIENT_COMPONENT_TEMPLATE = '''\
"use client";

import {{ useState }} from "react";

interface {name}Props {{
  // Props 정의
}}

export default function {name}({{ }}: {name}Props) {{
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ld-glass rounded-xl p-6">
      <h2 className="text-2xl font-bold text-primary">{name}</h2>
    </div>
  );
}}
'''

CSS_MODULE_TEMPLATE = '''\
/* {name}.module.css */

.container {{
  /* 컴포넌트 전용 스타일 */
}}
'''


def to_pascal_case(name: str) -> str:
    if name[0].isupper():
        return name
    return name[0].upper() + name[1:]


def generate_component(name: str, output_path: Path, is_client: bool, with_css: bool):
    name = to_pascal_case(name)
    output_path.mkdir(parents=True, exist_ok=True)

    tsx_path = output_path / f"{name}.tsx"
    template = CLIENT_COMPONENT_TEMPLATE if is_client else SERVER_COMPONENT_TEMPLATE
    tsx_content = template.format(name=name)

    with open(tsx_path, 'w', encoding='utf-8') as f:
        f.write(tsx_content)
    print(f"생성됨: {tsx_path}")

    if with_css:
        css_path = output_path / f"{name}.module.css"
        with open(css_path, 'w', encoding='utf-8') as f:
            f.write(CSS_MODULE_TEMPLATE.format(name=name))
        print(f"생성됨: {css_path}")

    print()
    print("=" * 50)
    print(f"컴포넌트 생성 완료: {name}")
    print("=" * 50)
    print(f"  종류: {'Client Component' if is_client else 'Server Component'}")
    print(f"  경로: {tsx_path}")
    if with_css:
        print(f"  CSS:  {output_path / f'{name}.module.css'}")
    print()
    print("다음 단계:")
    print(f"  1. {name}.tsx 에 Props 인터페이스 정의")
    print(f"  2. 컴포넌트 로직 작성")
    if with_css:
        print(f"  3. {name}.module.css 에 스타일 추가")
        print(f'     import styles from "./{name}.module.css";')


def main():
    parser = argparse.ArgumentParser(description="컴포넌트 생성기 — Next.js + TypeScript 보일러플레이트 생성")
    parser.add_argument('name', help='컴포넌트 이름 (PascalCase 권장, 예: LdPricingCard)')
    parser.add_argument('--path', '-p', default='.',
                        help='생성 경로 (기본: 현재 디렉토리)')
    parser.add_argument('--client', '-c', action='store_true',
                        help='"use client" 클라이언트 컴포넌트 생성')
    parser.add_argument('--css', action='store_true',
                        help='CSS Module 파일 동시 생성')

    args = parser.parse_args()

    output_path = Path(args.path)
    generate_component(args.name, output_path, args.client, args.css)


if __name__ == '__main__':
    main()
