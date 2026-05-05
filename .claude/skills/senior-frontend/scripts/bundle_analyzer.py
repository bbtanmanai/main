#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
번들 분석기 (bundle_analyzer.py)
Next.js 프로젝트의 번들 구성을 정적 분석하여 최적화 기회를 탐지합니다.
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from typing import Dict, List

# Windows UTF-8 출력
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# 무거운 라이브러리 경고 목록
HEAVY_PACKAGES = {
    'lodash': '(~71kb) → lodash/[함수명] 또는 네이티브 JS로 대체',
    'moment': '(~232kb) → date-fns 또는 Intl API 사용',
    'moment-timezone': '(~516kb) → date-fns-tz 사용',
    'jquery': '(~88kb) → 네이티브 DOM API 사용',
    'rxjs': '(~206kb) → 실제 필요 여부 검토',
    'three': '(~1MB) → dynamic import 필수',
    'chart.js': '(~200kb) → dynamic import 필수',
    '@aws-sdk/client-s3': '(~680kb) → 서버 전용으로 분리',
}

# "use client" 없이도 괜찮은 패턴 (서버 컴포넌트 가능)
CLIENT_HOOKS = ['useState', 'useEffect', 'useRef', 'useReducer', 'useContext',
                'useCallback', 'useMemo', 'useLayoutEffect', 'useId']
CLIENT_EVENTS = ['onClick', 'onChange', 'onSubmit', 'onKeyDown', 'onMouseEnter',
                 'onFocus', 'onBlur']


class BundleAnalyzer:
    """Next.js 번들 정적 분석기"""

    def __init__(self, target_path: str, verbose: bool = False):
        self.target_path = Path(target_path)
        self.verbose = verbose
        self.results: Dict = {}

    def run(self) -> Dict:
        print("번들 분석 시작...")
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
        findings: List[Dict] = []

        findings.extend(self._check_use_client_abuse())
        findings.extend(self._check_heavy_components())
        findings.extend(self._check_package_json())
        findings.extend(self._check_next_config())

        critical = [f for f in findings if f['심각도'] == 'CRITICAL']
        warnings = [f for f in findings if f['심각도'] == 'WARNING']
        infos = [f for f in findings if f['심각도'] == 'INFO']

        self.results = {
            '대상': str(self.target_path),
            '총_이슈': len(findings),
            'CRITICAL': len(critical),
            'WARNING': len(warnings),
            'INFO': len(infos),
            '발견_이슈': findings,
        }

        if self.verbose:
            print(f"분석 완료: {len(findings)}개 이슈")

    def _check_use_client_abuse(self) -> List[Dict]:
        """불필요한 "use client" 탐지 — 훅·이벤트 없는 파일"""
        issues = []
        src_path = self.target_path / 'src' if (self.target_path / 'src').exists() else self.target_path

        for file_path in src_path.rglob('*.tsx'):
            if any(skip in str(file_path) for skip in ['node_modules', '.next', 'dist']):
                continue
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
                if '"use client"' not in content and "'use client'" not in content:
                    continue
                has_hooks = any(f'{h}(' in content for h in CLIENT_HOOKS)
                has_events = any(e in content for e in CLIENT_EVENTS)
                has_window = 'window.' in content or 'document.' in content

                if not has_hooks and not has_events and not has_window:
                    rel = str(file_path.relative_to(self.target_path))
                    issues.append({
                        '파일': rel,
                        '심각도': 'WARNING',
                        '유형': '"use client" 불필요 의심',
                        '메시지': f'훅·이벤트·브라우저 API 없음 → Server Component 전환 검토',
                    })
            except Exception:
                pass
        return issues

    def _check_heavy_components(self) -> List[Dict]:
        """200줄 이상 컴포넌트에 dynamic import 누락 탐지"""
        issues = []
        src_path = self.target_path / 'src' if (self.target_path / 'src').exists() else self.target_path

        for file_path in src_path.rglob('*.tsx'):
            if any(skip in str(file_path) for skip in ['node_modules', '.next', 'dist', 'page.tsx', 'layout.tsx']):
                continue
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
                line_count = len(content.splitlines())

                if line_count >= 200:
                    has_dynamic = 'dynamic(' in content or 'next/dynamic' in content
                    if not has_dynamic and '"use client"' in content:
                        rel = str(file_path.relative_to(self.target_path))
                        issues.append({
                            '파일': rel,
                            '심각도': 'INFO',
                            '유형': '대형 클라이언트 컴포넌트',
                            '메시지': f'{line_count}줄 — dynamic import 적용 검토',
                        })
            except Exception:
                pass
        return issues

    def _check_package_json(self) -> List[Dict]:
        """무거운 의존성 탐지"""
        issues = []
        pkg_path = self.target_path / 'package.json'
        if not pkg_path.exists():
            pkg_path = self.target_path.parent / 'package.json'
        if not pkg_path.exists():
            return issues

        try:
            pkg = json.loads(pkg_path.read_text(encoding='utf-8'))
            all_deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}

            for pkg_name, advice in HEAVY_PACKAGES.items():
                if pkg_name in all_deps:
                    issues.append({
                        '파일': 'package.json',
                        '심각도': 'WARNING',
                        '유형': '무거운 의존성',
                        '메시지': f'{pkg_name} {advice}',
                    })
        except Exception:
            pass
        return issues

    def _check_next_config(self) -> List[Dict]:
        """next.config 이미지 최적화 설정 점검"""
        issues = []
        for config_name in ['next.config.mjs', 'next.config.js', 'next.config.ts']:
            config_path = self.target_path / config_name
            if not config_path.exists():
                config_path = self.target_path.parent / config_name
            if config_path.exists():
                try:
                    content = config_path.read_text(encoding='utf-8')
                    if 'unoptimized: true' in content:
                        issues.append({
                            '파일': config_name,
                            '심각도': 'WARNING',
                            '유형': '이미지 최적화 비활성',
                            '메시지': 'images.unoptimized: true → 제거하여 next/image 최적화 활성화',
                        })
                    if 'output: "export"' in content and 'images' not in content:
                        issues.append({
                            '파일': config_name,
                            '심각도': 'INFO',
                            '유형': 'Static Export 모드',
                            '메시지': 'output: export 모드 — next/image 최적화 제한됨',
                        })
                except Exception:
                    pass
                break
        return issues

    def generate_report(self):
        print("\n" + "=" * 60)
        print("번들 분석 리포트")
        print("=" * 60)
        print(f"대상: {self.results.get('대상')}")
        print(f"총 이슈: {self.results.get('총_이슈')}개")
        print(f"  CRITICAL: {self.results.get('CRITICAL')}개")
        print(f"  WARNING:  {self.results.get('WARNING')}개")
        print(f"  INFO:     {self.results.get('INFO')}개")

        findings = self.results.get('발견_이슈', [])
        if findings:
            print("\n발견된 이슈:")
            for issue in findings:
                print(f"  [{issue['심각도']}] {issue['유형']}")
                print(f"    파일: {issue['파일']}")
                print(f"    내용: {issue['메시지']}")
                print()
        else:
            print("\n최적화 이슈가 발견되지 않았습니다.")
        print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="번들 분석기 — Next.js 번들 최적화 기회 탐지")
    parser.add_argument('target', help='분석할 Next.js 프로젝트 경로')
    parser.add_argument('--verbose', '-v', action='store_true', help='상세 출력')
    parser.add_argument('--json', action='store_true', help='JSON 출력')
    parser.add_argument('--output', '-o', help='출력 파일 경로')

    args = parser.parse_args()

    tool = BundleAnalyzer(args.target, verbose=args.verbose)
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
