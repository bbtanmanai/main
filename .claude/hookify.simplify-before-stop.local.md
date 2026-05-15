---
name: simplify-before-stop
enabled: true
event: stop
pattern: .*
---

⚠️ **구현 완료 선언 전 — `simplify` 스킬 실행 필수**

"시니어가 보면 왜 이렇게 복잡하지?"를 방지합니다.

**완료 선언 전 필수 체크리스트:**
- [ ] `simplify` 스킬 → 중복·과추상화 제거
- [ ] `/verify` → TypeScript 타입 에러 0개
- [ ] `/qa-feature` → 수용 기준·LD 준수 확인

**섹션 10 고가치 스킬** (ai-behavior.md):
simplify는 구현 완료 직후 항상 실행. 건너뛰면 BACKLOG 완료 처리 불가.
