---
name: security-review-before-ship
enabled: true
event: prompt
conditions:
  - field: user_prompt
    operator: regex_match
    pattern: (배포|푸시|push|deploy|ship|PR 만들|pr 만들|올려줘|올려)
---

⚠️ **배포 요청 감지 — `security-review` 먼저 실행 필수**

**출시 전 체인 순서** (섹션 9-C, ai-behavior.md):
1. `security-review` → XSS·인증 우회·SQL injection·API 노출 점검
2. `review` → 코드 품질·컨벤션 최종 점검
3. `ship` → 배포·PR 생성

security-review 없이 ship 진행 금지.
