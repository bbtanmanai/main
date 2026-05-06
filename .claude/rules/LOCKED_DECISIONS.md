# 🔒 V2 잠금 결정 레지스트리

> **번복 절차**: 해당 LD 내용 사용자에게 보여주기 → "LD-XXX 번복 확인" 명시적 확인 → 진행 후 SUPERSEDED로 이동
> **AI**: 코드에서 `# 🔒 LD-` 발견 시 즉시 조회. V3 LD-001~016과 무관.

## 활성 잠금

| ID | 결정 | 코드 위치 | 절대 금지 |
|----|------|---------|---------|
| **LD-001** | `defaultTheme="dark"`, `enableSystem=false` 고정 | `layout.tsx` ThemeProvider | `defaultTheme="light"`, `enableSystem=true` |
| **LD-003** | V3 컴포넌트·유틸·훅 import 금지 — V2 독립 구현 | 모든 `.ts(x)` | `../../LinkDropV3/...` import |
| **LD-004** | LdStatusStepper 4색 고정: `#10b981`/`#6366f1`/`#eab308`/`#ef4444` | `LdStatusStepper.tsx` | 4색 외 상태 색상 추가 |
| **LD-005** | 랜딩 콘텐츠 `src/data/*.json` 전용 — Supabase·CMS 금지 | `src/data/*.json` | `supabase.table('landings').select()` |
| **LD-006** | liquid-glass = `.ld-glass` 단일 CSS 클래스 — JS 분기 금지 | `globals.css .ld-glass` | `isDark ? darkGlass : lightGlass` 분기 |
| **LD-007** | Anton = 영문 헤딩 전용. 한글은 Pretendard 800 | `globals.css` fontFamily | 한글 제목에 `font-anton` |
| **LD-009** | 인증 = Google·Kakao OAuth만. 이메일+비밀번호 영구 폐기 | `(auth)/*` | `signInWithPassword()` 복구, `/signup` 부활 |
| **LD-011** | role 4단계: `guest`/`partner`/`gold_partner`/`instructor`/`admin` | `useSession.ts`, `middleware.ts` | `role='buyer'`, 무료 구독 티어 |

> **LD-011 isBuyer 판정**: `role === 'partner' || role === 'gold_partner' || role === 'instructor' || role === 'admin'`

## SUPERSEDED

| 번복 | 내용 |
|-----|------|
| LD-002 → LD-008 | checkout은 사용자 테마 상속 (`data-theme="light"` 강제 해제) |
| LD-010 → LD-011 | `role='buyer'` 폐기 → guest/partner/gold_partner 체계로 확장 |
