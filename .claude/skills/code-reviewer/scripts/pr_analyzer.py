#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PR 분석기 (pr_analyzer.py)
변경된 파일을 분석하여 리뷰 우선순위와 영향 범위를 파악합니다.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Optional

# Windows UTF-8 출력
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')


class PrAnalyzer:
    """PR 변경 파일 분석기"""

    def __init__(self, target_path: str, verbose: bool = False):
        self.target_path = Path(target_path)
        self.verbose = verbose
        self.results: Dict = {}

    def run(self) -> Dict:
        """분석 실행"""
        print(f"PR 분석 시작...")
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
        """대상 경로 유효성 검사"""
        if not self.target_path.exists():
            raise ValueError(f"대상 경로가 존재하지 않습니다: {self.target_path}")
        if self.verbose:
            print(f"경로 확인 완료: {self.target_path}")

    def analyze(self):
        """파일 변경 사항 분석"""
        if self.verbose:
            print("파일 분석 중...")

        findings: List[Dict] = []

        # TSX/TS 파일 분석
        for file_path in self.target_path.rglob("*.tsx"):
            issues = self._check_tsx_file(file_path)
            findings.extend(issues)

        for file_path in self.target_path.rglob("*.ts"):
            if not str(file_path).endswith(".d.ts"):
                issues = self._check_ts_file(file_path)
                findings.extend(issues)

        self.results['상태'] = '완료'
        self.results['대상'] = str(self.target_path)
        self.results['발견_이슈'] = findings
        self.results['이슈_수'] = len(findings)

        if self.verbose:
            print(f"분석 완료: {len(findings)}개 이슈 발견")

    def _check_tsx_file(self, file_path: Path) -> List[Dict]:
        """TSX 파일에서 일반적인 문제 탐지"""
        issues = []
        try:
            content = file_path.read_text(encoding='utf-8')
            lines = content.splitlines()

            for i, line in enumerate(lines, 1):
                # console.log 탐지
                if 'console.log' in line and '// eslint-disable' not in line:
                    issues.append({
                        '파일': str(file_path),
                        '라인': i,
                        '심각도': 'INFO',
                        '유형': 'console.log 잔류',
                        '내용': line.strip()
                    })

                # 정적 인라인 style 탐지 (간단한 패턴)
                if 'style={{' in line and 'visibleSteps' not in line and 'scrollY' not in line:
                    if any(static in line for static in ['"18px"', '"24px"', '"32px"', 'fontSize:', 'padding:']):
                        issues.append({
                            '파일': str(file_path),
                            '라인': i,
                            '심각도': 'WARNING',
                            '유형': '정적 인라인 스타일',
                            '내용': line.strip()
                        })

        except Exception:
            pass
        return issues

    def _check_ts_file(self, file_path: Path) -> List[Dict]:
        """TS 파일에서 일반적인 문제 탐지"""
        issues = []
        try:
            content = file_path.read_text(encoding='utf-8')
            lines = content.splitlines()

            for i, line in enumerate(lines, 1):
                # any 타입 남용 탐지
                if ': any' in line or 'as any' in line:
                    issues.append({
                        '파일': str(file_path),
                        '라인': i,
                        '심각도': 'WARNING',
                        '유형': 'any 타입 사용',
                        '내용': line.strip()
                    })

        except Exception:
            pass
        return issues

    def generate_report(self):
        """리포트 출력"""
        print("\n" + "=" * 60)
        print("PR 분석 리포트")
        print("=" * 60)
        print(f"대상: {self.results.get('대상')}")
        print(f"상태: {self.results.get('상태')}")
        print(f"발견된 이슈: {self.results.get('이슈_수')}개")

        findings = self.results.get('발견_이슈', [])
        if findings:
            print("\n주요 이슈:")
            for issue in findings[:10]:  # 상위 10개만 출력
                print(f"  [{issue['심각도']}] {issue['유형']} — {issue['파일']}:{issue['라인']}")
                print(f"    {issue['내용'][:80]}")

        print("=" * 60 + "\n")


def main():
    """메인 진입점"""
    parser = argparse.ArgumentParser(description="PR 분석기 — 변경 파일 분석 및 리뷰 우선순위 파악")
    parser.add_argument('target', help='분석할 대상 경로')
    parser.add_argument('--verbose', '-v', action='store_true', help='상세 출력 활성화')
    parser.add_argument('--json', action='store_true', help='결과를 JSON으로 출력')
    parser.add_argument('--output', '-o', help='출력 파일 경로')

    args = parser.parse_args()

    tool = PrAnalyzer(args.target, verbose=args.verbose)
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
