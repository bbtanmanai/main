#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
코드 품질 검사기 (code_quality_checker.py)
TypeScript/JavaScript 코드의 품질 문제를 자동으로 탐지합니다.
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


# 탐지 규칙 정의
RULES = [
    {
        'id': 'NO_CONSOLE_LOG',
        'pattern': r'console\.log\(',
        '심각도': 'INFO',
        '메시지': 'console.log가 프로덕션 코드에 남아 있습니다',
        '제외': ['// eslint-disable'],
    },
    {
        'id': 'NO_ANY_TYPE',
        'pattern': r':\s*any\b|as\s+any\b',
        '심각도': 'WARNING',
        '메시지': 'any 타입 사용 — unknown 또는 구체적 타입으로 대체하세요',
        '제외': [],
    },
    {
        'id': 'NO_STATIC_INLINE_STYLE',
        'pattern': r"style=\{\{[^}]*(?:fontSize|padding|margin|color|background)[^}]*\}\}",
        '심각도': 'WARNING',
        '메시지': '정적 인라인 스타일 — CSS 클래스로 이동하세요 (design-principles.md §3-A)',
        '제외': ['visibleSteps', 'scrollY', 'progress', 'opacity:', 'transform:'],
    },
    {
        'id': 'NO_LEFT_BORDER_ACCENT',
        'pattern': r'border-?[lL]eft\s*:\s*\d+px\s+solid',
        '심각도': 'CRITICAL',
        '메시지': 'Left border accent 패턴 — 링크드랍 영구 금지 (design-principles.md §7)',
        '제외': [],
    },
    {
        'id': 'NO_HARDCODED_SECRET',
        'pattern': r'(api[_-]?key|secret|password|token)\s*=\s*["\'][^"\']{8,}["\']',
        '심각도': 'CRITICAL',
        '메시지': '하드코딩된 시크릿 — 환경변수로 이동하세요',
        '제외': ['process.env', 'NEXT_PUBLIC_'],
    },
    {
        'id': 'NO_DOUBLE_ASSERTION',
        'pattern': r'as unknown as \w',
        '심각도': 'WARNING',
        '메시지': '이중 타입 단언 (as unknown as T) — 타입 가드 함수로 대체하세요',
        '제외': [],
    },
    {
        'id': 'NO_SOLID_BG_BLOB',
        'pattern': r'background:\s*rgba\([^)]+,\s*0\.[89]\d*\)',
        '심각도': 'WARNING',
        '메시지': '높은 불투명도 배경 — blob scene이 차단될 수 있습니다',
        '제외': ['glass', 'modal', 'overlay'],
    },
]


class CodeQualityChecker:
    """코드 품질 검사기"""

    def __init__(self, target_path: str, verbose: bool = False):
        self.target_path = Path(target_path)
        self.verbose = verbose
        self.results: Dict = {}

    def run(self) -> Dict:
        """검사 실행"""
        print(f"코드 품질 검사 시작...")
        print(f"대상 경로: {self.target_path}")

        try:
            self.validate_target()
            self.analyze()
            self.generate_report()
            print("검사 완료!")
            return self.results

        except Exception as e:
            print(f"오류 발생: {e}")
            sys.exit(1)

    def validate_target(self):
        """대상 경로 유효성 검사"""
        if not self.target_path.exists():
            raise ValueError(f"대상 경로가 존재하지 않습니다: {self.target_path}")
        if self.verbose:
            print(f"경로 확인 완료: {self.target_path}")

    def analyze(self):
        """파일 분석"""
        if self.verbose:
            print("코드 분석 중...")

        findings: List[Dict] = []
        file_count = 0

        extensions = ['*.tsx', '*.ts', '*.css', '*.js']
        for ext in extensions:
            for file_path in self.target_path.rglob(ext):
                # node_modules, .next 제외
                if any(skip in str(file_path) for skip in ['node_modules', '.next', 'dist', '.d.ts']):
                    continue
                file_issues = self._check_file(file_path)
                findings.extend(file_issues)
                file_count += 1

        # 심각도별 분류
        critical = [f for f in findings if f['심각도'] == 'CRITICAL']
        warnings = [f for f in findings if f['심각도'] == 'WARNING']
        infos = [f for f in findings if f['심각도'] == 'INFO']

        self.results['상태'] = '완료'
        self.results['대상'] = str(self.target_path)
        self.results['검사_파일_수'] = file_count
        self.results['총_이슈'] = len(findings)
        self.results['CRITICAL'] = len(critical)
        self.results['WARNING'] = len(warnings)
        self.results['INFO'] = len(infos)
        self.results['발견_이슈'] = findings

        if self.verbose:
            print(f"검사 완료: {file_count}개 파일, {len(findings)}개 이슈")

    def _check_file(self, file_path: Path) -> List[Dict]:
        """단일 파일 검사"""
        issues = []
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            lines = content.splitlines()

            for rule in RULES:
                pattern = re.compile(rule['pattern'], re.IGNORECASE)
                for i, line in enumerate(lines, 1):
                    # 제외 패턴 확인
                    if any(exc in line for exc in rule.get('제외', [])):
                        continue
                    if pattern.search(line):
                        issues.append({
                            '파일': str(file_path.relative_to(self.target_path)),
                            '라인': i,
                            '심각도': rule['심각도'],
                            '규칙': rule['id'],
                            '메시지': rule['메시지'],
                            '코드': line.strip()[:100],
                        })
        except Exception:
            pass
        return issues

    def generate_report(self):
        """리포트 출력"""
        print("\n" + "=" * 60)
        print("코드 품질 검사 리포트")
        print("=" * 60)
        print(f"대상: {self.results.get('대상')}")
        print(f"검사 파일: {self.results.get('검사_파일_수')}개")
        print(f"총 이슈: {self.results.get('총_이슈')}개")
        print(f"  CRITICAL: {self.results.get('CRITICAL')}개")
        print(f"  WARNING:  {self.results.get('WARNING')}개")
        print(f"  INFO:     {self.results.get('INFO')}개")

        findings = self.results.get('발견_이슈', [])
        criticals = [f for f in findings if f['심각도'] == 'CRITICAL']
        if criticals:
            print("\nCRITICAL 이슈 (즉시 수정 필요):")
            for issue in criticals:
                print(f"  {issue['파일']}:{issue['라인']}")
                print(f"  [{issue['규칙']}] {issue['메시지']}")
                print(f"  코드: {issue['코드']}")
                print()

        print("=" * 60 + "\n")


def main():
    """메인 진입점"""
    parser = argparse.ArgumentParser(description="코드 품질 검사기 — TypeScript/React 코드 이슈 자동 탐지")
    parser.add_argument('target', help='검사할 대상 경로')
    parser.add_argument('--verbose', '-v', action='store_true', help='상세 출력 활성화')
    parser.add_argument('--json', action='store_true', help='결과를 JSON으로 출력')
    parser.add_argument('--output', '-o', help='출력 파일 경로')

    args = parser.parse_args()

    tool = CodeQualityChecker(args.target, verbose=args.verbose)
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
