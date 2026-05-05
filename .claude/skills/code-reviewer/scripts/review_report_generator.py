#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
리뷰 리포트 생성기 (review_report_generator.py)
코드 품질 검사 결과를 구조화된 마크다운 리포트로 생성합니다.
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List

# Windows UTF-8 출력
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')


class ReviewReportGenerator:
    """리뷰 리포트 생성기"""

    def __init__(self, target_path: str, verbose: bool = False):
        self.target_path = Path(target_path)
        self.verbose = verbose
        self.results: Dict = {}

    def run(self) -> Dict:
        """리포트 생성 실행"""
        print(f"리뷰 리포트 생성 시작...")
        print(f"대상 경로: {self.target_path}")

        try:
            self.validate_target()
            self.analyze()
            self.generate_report()
            print("리포트 생성 완료!")
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
        """코드 분석 및 리포트 데이터 수집"""
        if self.verbose:
            print("분석 중...")

        stats = self._collect_stats()
        issues = self._collect_issues()

        self.results['생성일시'] = datetime.now().strftime('%Y-%m-%d %H:%M')
        self.results['대상'] = str(self.target_path)
        self.results['통계'] = stats
        self.results['이슈'] = issues
        self.results['요약'] = self._build_summary(stats, issues)

        if self.verbose:
            print(f"분석 완료: {stats.get('총_파일')}개 파일 검사")

    def _collect_stats(self) -> Dict:
        """파일 통계 수집"""
        stats = {
            '총_파일': 0,
            'tsx_파일': 0,
            'ts_파일': 0,
            'css_파일': 0,
            '총_라인': 0,
        }

        for ext, key in [('*.tsx', 'tsx_파일'), ('*.ts', 'ts_파일'), ('*.css', 'css_파일')]:
            for file_path in self.target_path.rglob(ext):
                if any(skip in str(file_path) for skip in ['node_modules', '.next', '.d.ts']):
                    continue
                stats[key] += 1
                stats['총_파일'] += 1
                try:
                    content = file_path.read_text(encoding='utf-8', errors='ignore')
                    stats['총_라인'] += len(content.splitlines())
                except Exception:
                    pass

        return stats

    def _collect_issues(self) -> List[Dict]:
        """이슈 수집"""
        issues = []

        checks = [
            ('console.log', 'INFO', 'console.log 잔류', 'console.log 제거 또는 logger 유틸 사용'),
            (': any', 'WARNING', 'any 타입 사용', 'unknown 또는 구체적 타입으로 대체'),
            ('border-left:', 'CRITICAL', 'left border accent', '뱃지·아이콘 조합으로 대체 (design-principles.md §7)'),
            ('dangerouslySetInnerHTML', 'WARNING', 'XSS 잠재 위험', 'DOMPurify.sanitize() 적용 검토'),
        ]

        for file_path in self.target_path.rglob('*'):
            if file_path.suffix not in ['.tsx', '.ts', '.css', '.js']:
                continue
            if any(skip in str(file_path) for skip in ['node_modules', '.next']):
                continue

            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
                for pattern, severity, title, suggestion in checks:
                    count = content.count(pattern)
                    if count > 0:
                        issues.append({
                            '파일': str(file_path.relative_to(self.target_path)),
                            '심각도': severity,
                            '유형': title,
                            '발생_횟수': count,
                            '권장_조치': suggestion,
                        })
            except Exception:
                pass

        # 심각도 우선순위 정렬
        severity_order = {'CRITICAL': 0, 'WARNING': 1, 'INFO': 2}
        issues.sort(key=lambda x: severity_order.get(x['심각도'], 3))

        return issues

    def _build_summary(self, stats: Dict, issues: List[Dict]) -> Dict:
        """요약 정보 생성"""
        critical_count = sum(1 for i in issues if i['심각도'] == 'CRITICAL')
        warning_count = sum(1 for i in issues if i['심각도'] == 'WARNING')
        info_count = sum(1 for i in issues if i['심각도'] == 'INFO')

        if critical_count > 0:
            overall = '머지 불가 — CRITICAL 이슈 수정 필요'
        elif warning_count > 3:
            overall = '조건부 머지 — WARNING 이슈 검토 권장'
        else:
            overall = '머지 가능 — 경미한 개선 사항만 존재'

        return {
            'CRITICAL': critical_count,
            'WARNING': warning_count,
            'INFO': info_count,
            '총_이슈': len(issues),
            '종합_판정': overall,
        }

    def generate_report(self):
        """마크다운 리포트 출력"""
        summary = self.results.get('요약', {})
        stats = self.results.get('통계', {})
        issues = self.results.get('이슈', [])

        report_lines = [
            f"# 코드 리뷰 리포트",
            f"",
            f"**생성일시:** {self.results.get('생성일시')}",
            f"**대상:** `{self.results.get('대상')}`",
            f"",
            f"---",
            f"",
            f"## 종합 판정",
            f"",
            f"> **{summary.get('종합_판정')}**",
            f"",
            f"| 심각도 | 수 |",
            f"|--------|-----|",
            f"| CRITICAL | {summary.get('CRITICAL')} |",
            f"| WARNING  | {summary.get('WARNING')} |",
            f"| INFO     | {summary.get('INFO')} |",
            f"",
            f"---",
            f"",
            f"## 파일 통계",
            f"",
            f"- 총 파일: {stats.get('총_파일')}개",
            f"- TSX: {stats.get('tsx_파일')}개",
            f"- TS: {stats.get('ts_파일')}개",
            f"- CSS: {stats.get('css_파일')}개",
            f"- 총 라인: {stats.get('총_라인'):,}줄",
            f"",
            f"---",
            f"",
            f"## 발견된 이슈",
            f"",
        ]

        if not issues:
            report_lines.append("이슈가 발견되지 않았습니다.")
        else:
            for issue in issues:
                report_lines.extend([
                    f"### [{issue['심각도']}] {issue['유형']}",
                    f"",
                    f"- **파일:** `{issue['파일']}`",
                    f"- **발생 횟수:** {issue['발생_횟수']}회",
                    f"- **권장 조치:** {issue['권장_조치']}",
                    f"",
                ])

        report = '\n'.join(report_lines)
        print(report)
        self.results['마크다운_리포트'] = report

    def save_markdown(self, output_path: str):
        """마크다운 리포트 파일로 저장"""
        report = self.results.get('마크다운_리포트', '')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"리포트가 저장되었습니다: {output_path}")


def main():
    """메인 진입점"""
    parser = argparse.ArgumentParser(description="리뷰 리포트 생성기 — 코드 리뷰 결과를 마크다운 리포트로 생성")
    parser.add_argument('target', help='분석할 대상 경로')
    parser.add_argument('--analyze', action='store_true', help='심층 분석 실행')
    parser.add_argument('--verbose', '-v', action='store_true', help='상세 출력 활성화')
    parser.add_argument('--json', action='store_true', help='결과를 JSON으로 출력')
    parser.add_argument('--output', '-o', help='출력 파일 경로 (.md 또는 .json)')
    parser.add_argument('--markdown', '-m', help='마크다운 리포트 저장 경로')

    args = parser.parse_args()

    tool = ReviewReportGenerator(args.target, verbose=args.verbose)
    results = tool.run()

    if args.markdown:
        tool.save_markdown(args.markdown)

    if args.json:
        output = json.dumps(results, indent=2, ensure_ascii=False)
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(output)
            print(f"JSON 결과가 저장되었습니다: {args.output}")
        else:
            print(output)


if __name__ == '__main__':
    main()
