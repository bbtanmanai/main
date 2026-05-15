---
name: browse-after-ui-edit
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: (landing\d+|LdLanding|components/landing).*\.tsx$
---

⚠️ **UI 파일 수정 감지 — `browse` 스킬 실행 필수**

TypeScript 빌드 통과 ≠ UI 정상. 실제 브라우저에서 반드시 확인하세요.

**지금 바로 실행:**
- `browse` 스킬 → 실제 렌더링·반응형(375px)·터치 검증
- `design-audit` 스킬 → LD 준수·Left Border·glass 패턴 점검

**섹션 9-A/D 체인** (ai-behavior.md) 기준:
browse → design-audit 순서 건너뛰면 구현 완료 처리 불가.
