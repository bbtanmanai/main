---
# V2 SESSION START — 이 파일 하나만 먼저 읽을 것
> 업데이트: 2026-04-26 | 전체 규칙: rules/LOCKED_DECISIONS.md | 전체 작업: rules/BACKLOG.md
---

## 🚨 지금 해야 할 일 (BACKLOG 요약)

| 항목 | 상태 | 비고 |
|------|------|------|
| TOSS | ⬜ | 토스페이먼츠 SDK 실제 키 연동 (payment/page.tsx placeholder 교체) |

> AUTH-SOCIAL-B, AUTH-SOCIAL-C, AUTH-GUARD 모두 완료 (2026-04-26)
> 남은 것: Google/Kakao Developers OAuth 앱 등록은 사용자 직접 진행 필요

---

## 🔒 잠금 결정 즉시 참조표 (전체: rules/LOCKED_DECISIONS.md)

| LD | 핵심 규칙 | 절대 금지 |
|----|---------|---------|
| LD-001 | `defaultTheme="dark"`, `enableSystem=false` | defaultTheme="light", enableSystem=true |
| LD-003 | V3 컴포넌트 import 절대 금지 — V2 전용 독립 구현 | `../../LinkDropV3/...` 경로 import |
| LD-004 | LdStatusStepper 4색 고정 (#10b981/#6366f1/#eab308/#ef4444) | 동적 색상 변경, 5번째 상태색 추가 |
| LD-005 | 마케팅 콘텐츠는 `src/data/*.json` 전용 (DB/CMS 금지) | Supabase/API로 랜딩 데이터 조회 |
| LD-006 | liquid-glass = `.ld-glass` 단일 CSS 클래스 (JS 분기 금지) | JS에서 isDark 분기로 glass 스타일 변경 |
| LD-007 | Anton = 영문 대형 헤딩만 / 한글 = Pretendard 800 | 한글에 font-anton 적용 |
| LD-008 | (checkout) 테마 상속 — data-theme="light" 강제 금지 | checkout 라이트 강제 |
| LD-009 | 인증 = Google OAuth + Kakao OAuth만. 이메일+비번 영구 폐기 | signInWithPassword 복구, /signup 부활 |
| LD-011 | role 체계: guest/partner/gold_partner/instructor/admin | role='buyer' 사용, guest에게 콘텐츠 열람 허용 |

---

## ⚡ 코드 수정 전 체크

1. `rules/LOCKED_DECISIONS.md` 해당 LD 있는지?
2. 코드에 `# 🔒 LD-` 주석 있는지?
3. V3 경로를 import하거나 참조하려는 것은 아닌지? (LD-003)

→ 하나라도 해당되면 **수정 전 LD 내용을 사용자에게 먼저 보여줄 것**

---

## 📁 추가 읽기가 필요한 경우만 (평상시 불필요)

| 상황 | 읽을 파일 |
|------|---------|
| 설계 전체 레퍼런스 | `archives/01_V2_프론트_설계_확정.md` |
| 404 라우트 문제 | `archives/02_라우트그룹_404_원인분석.md` |
| role/수당 구조 | `archives/03_V2_회원구분 및 역할.md` |
| 디버깅 체크리스트 | `rules/debugging.md` |
| Windows bat/cmd 작성 | `rules/windows.md` |
