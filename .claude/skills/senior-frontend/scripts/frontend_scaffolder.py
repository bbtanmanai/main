#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
프론트엔드 스캐폴더 (frontend_scaffolder.py)
V2 프로젝트 구조를 분석하고 CSS 아키텍처·컴포넌트 분류 리포트를 생성합니다.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Tuple

# Windows UTF-8 출력
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')


class FrontendScaffolder:
    """V2 프론트엔드 구조 분석기"""

    def __init__(self, target_path: str, verbose: bool = False):
        self.target_path = Path(target_path)
        self.verbose = verbose
        self.results: Dict = {}

    def run(self) -> Dict:
        print("프론트엔드 구조 분석 시작...")
        print(f"대상 경로: {self.target_path}")

        try:
            self.validate_target()
            self.analyze()
            self.generate_report()
            print("분석 완료!")
            return self.results
        except Exception as e:
            print(f"오류 발생: {e}")
            sys.exit(1)

    def validate_target(self):
        if not self.target_path.exists():
            raise ValueError(f"대상 경로가 존재하지 않습니다: {self.target_path}")

    def analyze(self):
        pages = self._scan_pages()
        components = self._scan_components()
        css_issues = self._check_css_architecture()
        large_files = self._find_large_files()

        self.results = {
            '대상': str(self.target_path),
            '페이지': pages,
            '컴포넌트': components,
            'CSS_이슈': css_issues,
            '대형_파일': large_files,
        }

        if self.verbose:
            print(f"페이지: {len(pages)}개, 컴포넌트: {len(components)}개")

    def _scan_pages(self) -> List[Dict]:
        """app 디렉토리 하위 page.tsx 스캔"""
        pages = []
        app_path = self.target_path / 'app'
        if not app_path.exists():
            return pages

        for file_path in app_path.rglob('page.tsx'):
            if any(skip in str(file_path) for skip in ['node_modules', '.next']):
                continue
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
                is_client = '"use client"' in content or "'use client'" in content
                is_async = 'async function' in content or 'async ()' in content
                line_count = len(content.splitlines())
                rel = str(file_path.relative_to(self.target_path))

                pages.append({
                    '경로': rel,
                    '종류': 'Client' if is_client else 'Server',
                    'async': is_async and not is_client,
                    '줄수': line_count,
                })
            except Exception:
                pass
        return sorted(pages, key=lambda x: x['경로'])

    def _scan_components(self) -> List[Dict]:
        """components 디렉토리 하위 .tsx 스캔"""
        components = []
        comp_path = self.target_path / 'components'
        if not comp_path.exists():
            return components

        for file_path in comp_path.rglob('*.tsx'):
            if any(skip in str(file_path) for skip in ['node_modules', '.next']):
                continue
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
                is_client = '"use client"' in content or "'use client'" in content
                line_count = len(content.splitlines())
                rel = str(file_path.relative_to(self.target_path))

                components.append({
                    '경로': rel,
                    '종류': 'Client' if is_client else 'Server',
                    '줄수': line_count,
                })
            except Exception:
                pass
        return sorted(components, key=lambda x: -x['줄수'])

    def _check_css_architecture(self) -> List[Dict]:
        """V2 CSS 아키텍처 규칙 준수 여부 점검"""
        issues = []
        styles_path = self.target_path / 'styles'

        if not styles_path.exists():
            return issues

        # globals.css는 @import 인덱스만 — 직접 CSS 작성 금지
        globals_path = self.target_path / 'app' / 'globals.css'
        if globals_path.exists():
            try:
                content = globals_path.read_text(encoding='utf-8', errors='ignore')
                lines = content.splitlines()
                non_import_lines = [
                    l.strip() for l in lines
                    if l.strip() and not l.strip().startswith('@import')
                    and not l.strip().startswith('/*')
                    and not l.strip().startswith('*')
                    and l.strip() != '*/'
                    and not l.strip().startswith('//')
                ]
                if len(non_import_lines) > 10:
                    issues.append({
                        '파일': 'app/globals.css',
                        '심각도': 'WARNING',
                        '메시지': f'globals.css에 @import 외 CSS 직접 작성 감지 ({len(non_import_lines)}줄) — styles/ 분산 권장',
                    })
            except Exception:
                pass

        # pages/ 하위 CSS 파일이 없으면 안내
        pages_css_path = styles_path / 'pages'
        if not pages_css_path.exists():
            issues.append({
                '파일': 'styles/pages/',
                '심각도': 'INFO',
                '메시지': 'styles/pages/ 디렉토리 없음 — 라우트 전용 CSS는 여기에 위치해야 함',
            })

        return issues

    def _find_large_files(self) -> List[Dict]:
        """300줄 이상 파일 탐지"""
        large = []
        for ext in ['*.tsx', '*.ts']:
            for file_path in self.target_path.rglob(ext):
                if any(skip in str(file_path) for skip in ['node_modules', '.next', 'dist', '.d.ts']):
                    continue
                try:
                    content = file_path.read_text(encoding='utf-8', errors='ignore')
                    line_count = len(content.splitlines())
                    if line_count >= 300:
                        rel = str(file_path.relative_to(self.target_path))
                        large.append({'경로': rel, '줄수': line_count})
                except Exception:
                    pass
        return sorted(large, key=lambda x: -x['줄수'])[:15]

    def generate_report(self):
        pages = self.results.get('페이지', [])
        components = self.results.get('컴포넌트', [])
        css_issues = self.results.get('CSS_이슈', [])
        large_files = self.results.get('대형_파일', [])

        server_pages = [p for p in pages if p['종류'] == 'Server']
        client_pages = [p for p in pages if p['종류'] == 'Client']
        server_comps = [c for c in components if c['종류'] == 'Server']
        client_comps = [c for c in components if c['종류'] == 'Client']

        print("\n" + "=" * 60)
        print("프론트엔드 구조 리포트")
        print("=" * 60)
        print(f"대상: {self.results.get('대상')}")
        print()

        print(f"[ 페이지 ({len(pages)}개) ]")
        print(f"  Server: {len(server_pages)}개  Client: {len(client_pages)}개")
        for p in pages[:10]:
            marker = 'C' if p['종류'] == 'Client' else 'S'
            async_mark = ' async' if p.get('async') else ''
            print(f"  [{marker}]{async_mark} {p['경로']} ({p['줄수']}줄)")
        if len(pages) > 10:
            print(f"  ... 외 {len(pages)-10}개")
        print()

        print(f"[ 컴포넌트 상위 10개 (크기순) ]")
        print(f"  Server: {len(server_comps)}개  Client: {len(client_comps)}개")
        for c in components[:10]:
            marker = 'C' if c['종류'] == 'Client' else 'S'
            size_warn = ' ← 분리 검토' if c['줄수'] >= 300 else ''
            print(f"  [{marker}] {c['경로']} ({c['줄수']}줄){size_warn}")
        print()

        if css_issues:
            print(f"[ CSS 아키텍처 이슈 ({len(css_issues)}개) ]")
            for issue in css_issues:
                print(f"  [{issue['심각도']}] {issue['파일']}")
                print(f"    {issue['메시지']}")
            print()

        if large_files:
            print(f"[ 300줄 이상 파일 ({len(large_files)}개) ]")
            for f in large_files[:8]:
                print(f"  {f['경로']} ({f['줄수']}줄)")
            print()

        print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="프론트엔드 스캐폴더 — V2 프로젝트 구조 분석")
    parser.add_argument('target', help='분석할 src 경로 (예: ./apps/web/src)')
    parser.add_argument('--verbose', '-v', action='store_true', help='상세 출력')
    parser.add_argument('--json', action='store_true', help='JSON 출력')
    parser.add_argument('--output', '-o', help='출력 파일 경로')

    args = parser.parse_args()

    tool = FrontendScaffolder(args.target, verbose=args.verbose)
    results = tool.run()

    if args.json:
        output = json.dumps(results, indent=2, ensure_ascii=False)
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(output)
            print(f"결과가 저장되었습니다: {args.output}")
        else:
            print(output)


if __name__ == '__main__':
    main()
