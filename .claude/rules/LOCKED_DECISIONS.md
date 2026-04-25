# 🔒 LinkDrop V2 — 잠금된 설계 결정 레지스트리

> **이 문서는 모든 대화 시작 전 반드시 읽어야 한다.**
>
> **잠금된 결정을 번복하려면 반드시 아래 프로토콜을 따른다:**
> 1. 해당 LD-XXX ID를 찾아 결정 이유를 사용자에게 먼저 보여준다
> 2. `"LD-XXX 번복 확인"` 이라고 사용자가 명시적으로 말한 경우에만 진행
> 3. 번복 승인 후 이 문서의 해당 항목을 SUPERSEDED로 이동하고 새 LD를 추가
>
> **AI에게**: 코드를 읽다가 `# 🔒 LD-` 주석을 발견하면 이 문서를 즉시 조회할 것.
> 변경 제안 전에 항상 이 목록을 확인할 것 — "개선처럼 보이는 것"이 잠금된 결정일 수 있다.
>
> **주의**: V3의 LOCKED_DECISIONS(LD-001~016)는 V2와 무관. V3 LD 번호를 V2에 적용하지 말 것.

---

## 활성 잠금 목록

### LD-001 — 다크 기본 테마 (defaultTheme="dark", enableSystem=false)
- **잠금 날짜**: 2026-04-22
- **관련 문서**: archives/01번 §테마 전략
- **결정 내용**: `next-themes` 설정은 반드시 `defaultTheme="dark"`, `enableSystem=false`.
  시스템 테마를 자동으로 따르지 않는다. 상단 토글로만 전환 허용.
  index(/) 페이지의 기본 경험은 다크 — liquid-glass + `#010828` + neon `#6FFF00`.
- **이유**: `Front index prompt.md` 디자인 언어가 다크 기반(#010828 딥 네이비).
  사용자가 2026-04-22 명시적으로 "기본은 다크로 한다" 확정.
  시네마틱·프리미엄 분위기는 다크에서 완성됨.
- **코드 위치**: `apps/web/src/app/layout.tsx` → `<ThemeProvider>`
- **절대 하지 말 것**: `defaultTheme="light"` 설정, `enableSystem=true` 설정,
  OS 라이트모드 감지로 자동 전환, 첫 방문자에게 라이트 강제

---

### ~~LD-002~~ — SUPERSEDED → LD-008 참조

---

### LD-003 — V3 컴포넌트 import 절대 금지 (독립 구현)
- **잠금 날짜**: 2026-04-22
- **관련 문서**: CLAUDE.md §V3 참조 규칙
- **결정 내용**: `C:\LinkDropV3\apps\web\` 의 어떤 컴포넌트·유틸·훅도 V2 코드에서 import 금지.
  기능이 동일하더라도 V2 전용으로 독립 구현한다.
- **이유**: V2와 V3는 완전히 분리된 프로젝트. 공유 의존성이 생기면 한쪽 변경이 다른 쪽을 깨뜨린다.
  V2는 소비자 접점 앱, V3는 콘텐츠 생산 엔진 — 릴리즈 주기·기술스택 진화 방향이 다르다.
- **코드 위치**: 모든 `apps/web/src/**/*.ts(x)` 파일
- **절대 하지 말 것**: `../../LinkDropV3/apps/web/src/...` 경로 import,
  V3 유틸 함수를 복사 없이 직접 참조, 공유 패키지 monorepo 구성 (사용자 허가 없이)

---

### LD-004 — LdStatusStepper 4색 고정 (#10b981 / #6366f1 / #eab308 / #ef4444)
- **잠금 날짜**: 2026-04-22
- **관련 문서**: archives/01번 §LdStatusStepper 스펙
- **결정 내용**: `LdStatusStepper` 컴포넌트의 4단계 상태 색상은 고정:
  - 완료(success): `#10b981` (emerald-500)
  - 진행중(active): `#6366f1` (indigo-500)
  - 대기(pending): `#eab308` (yellow-500)
  - 오류(error): `#ef4444` (red-500)
- **이유**: 파트너 수당·회원 진행 상태를 여러 화면에서 반복 표시할 때 색상 일관성이 신뢰감을 만든다.
  색상이 화면마다 달라지면 사용자가 "상태가 바뀌었나?" 혼동한다.
- **코드 위치**: `apps/web/src/components/LdStatusStepper.tsx`
- **절대 하지 말 것**: Tailwind 동적 클래스로 색상 변경 (`text-${color}`),
  이 4색 외 다른 색상 상태 추가, CSS 변수로 외부에서 주입 허용

---

### LD-005 — src/data/*.json 정적 콘텐츠 (CMS·Supabase 저장 금지)
- **잠금 날짜**: 2026-04-22
- **관련 문서**: archives/01번 §JSON 파일 목록
- **결정 내용**: 랜딩 카피·FAQ·후기·가격 등 마케팅 콘텐츠는 모두 `apps/web/src/data/*.json`에 저장.
  Supabase 테이블이나 외부 CMS(Contentful 등)에 저장 금지.
- **이유**: V2 마케팅 사이트는 SSG(정적 빌드) — 런타임 DB 조회가 없어야 Lighthouse 90+ 달성 가능.
  JSON 파일은 Git으로 버전 관리되고 비개발자도 직접 편집 가능.
  `doc: project-brief.md §범위 고정` — "결제·회원·마이페이지는 범위 밖"이므로 동적 콘텐츠 불필요.
- **코드 위치**: `apps/web/src/data/*.json`, `apps/web/src/app/landing/[slug]/page.tsx`
- **절대 하지 말 것**: `supabase.table('landings').select()` 랜딩 데이터 호출,
  `fetch('/api/faq')` 런타임 API 호출로 마케팅 콘텐츠 조회,
  getServerSideProps 사용 (SSG 원칙 위반)

---

### LD-006 — liquid-glass는 단일 CSS 클래스, JS 분기 금지
- **잠금 날짜**: 2026-04-22
- **관련 문서**: archives/01번 §liquid-glass 파라미터
- **결정 내용**: liquid-glass 효과는 `.ld-glass` 단일 CSS 클래스로 구현.
  JS에서 테마·조건에 따라 다른 glass 스타일을 동적으로 적용하는 분기 코드 금지.
- **이유**: glass 효과는 순수 CSS(`backdrop-filter`, `background`, `border`)로 충분히 구현 가능.
  JS 분기가 생기면 SSR 하이드레이션 불일치(Hydration mismatch) 발생 위험.
  CSS 변수만으로 다크/라이트 파라미터 전환이 되므로 JS 개입 불필요.
- **코드 위치**: `apps/web/src/styles/globals.css` → `.ld-glass` 클래스
- **절대 하지 말 것**: `const glassStyle = isDark ? darkGlass : lightGlass` 분기,
  ThemeContext를 glass 컴포넌트 내부에서 직접 구독하여 스타일 변환

---

### LD-007 — Anton은 영문 헤딩 전용, 한글은 Pretendard 800
- **잠금 날짜**: 2026-04-22
- **관련 문서**: archives/01번 §폰트 전략
- **결정 내용**: 
  - 영문 대형 헤딩(히어로 타이틀 등)에만 Anton 사용 허용
  - 한글 텍스트에는 Anton 절대 금지 — Pretendard Variable 800 사용
  - 본문·한글 UI 텍스트 전체는 Pretendard Variable 전용
- **이유**: Anton은 라틴 알파벳 전용 디스플레이 폰트. 한글 글리프가 없어 시스템 폰트로 fallback되면
  렌더링 불일치가 발생한다. 시니어 대상 사이트에서 폰트 혼재는 피로감을 높인다.
  `doc: tokens-typography.md §1` — Pretendard Variable을 한글·영문·숫자 통합 폰트로 명시.
- **코드 위치**: `apps/web/src/styles/globals.css`, Tailwind `fontFamily` 설정
- **절대 하지 말 것**: 한글 제목에 `font-anton` 클래스 적용,
  Anton을 기본 sans 폰트로 설정, 한글 혼용 섹션에 Anton 사용

---

### LD-009 — 이메일+비밀번호 로그인 영구 폐기 (소셜 로그인 전용)
- **잠금 날짜**: 2026-04-24
- **결정 내용**: 인증 수단은 Google OAuth·Kakao OAuth만 허용. 이메일+비밀번호 입력 필드, 비밀번호 찾기, 이메일 인증 코드 전송 기능 전면 제거. `(auth)/signup/page.tsx` 삭제. `(auth)/login/page.tsx`는 `/?auth=1` 리다이렉트 stub으로만 유지.
- **이유**: 시니어 대상 서비스에서 비밀번호 관리 마찰이 이탈의 주원인. 소셜 로그인은 2-탭으로 완료되므로 전환율 극대화. 비밀번호 DB 저장·해시·재설정 로직 없이 보안 면책.
- **코드 위치**: `apps/web/src/app/(auth)/`, `apps/web/src/components/auth/`
- **절대 하지 말 것**: 이메일+비밀번호 `signInWithPassword()` 호출 복구, 비밀번호 필드가 있는 폼 컴포넌트 추가, `/signup` 라우트 부활

---

### LD-011 — users.role 4단계 체계 및 명칭 (LD-010 대체)
- **잠금 날짜**: 2026-04-25 (2026-04-25 명칭 확정)
- **결정 내용**:
  - `guest` → **일반회원** — 소셜 로그인 직후 자동 부여. 콘텐츠 없음.
  - `partner` → **파트너회원** — 1회성 결제(₩59,000) 완료 시 자동 승격. `/member/*` + `/partner/*` 접근.
  - `gold_partner` → **골드파트너회원** — 월결제(₩29,000/월) 완료 시 자동 승격. `/member/*` + `/partner/*` 접근.
  - `instructor` → **강사회원** — 관리자 수동 부여. 전체 접근.
  - `admin` → **관리자** — 수동 부여. 전체 관리.
- **이유**: 구매자는 곧 파트너 — 즉시 수당 추적·추천 링크 사용 가능. 월결제 골드 등급으로 차별화.
- **코드 위치**: `apps/web/src/hooks/useSession.ts`, `apps/web/src/middleware.ts`, Supabase `users.role` 컬럼
- **isBuyer 판정**: `role === 'partner' || role === 'gold_partner' || role === 'instructor' || role === 'admin'`
- **절대 하지 말 것**: guest에게 콘텐츠 열람 허용, `role='buyer'` 사용, 무료 구독 티어 추가

---

## ⚠️ 번복 처리 절차

잠금된 결정을 번복해야 하는 경우:

```
1. 해당 LD 항목을 사용자에게 보여준다
2. "LD-XXX를 번복하려 합니다. 결정 이유: [이유]. 번복 사유: [사유]. 진행하시겠습니까?" 확인
3. 사용자가 "LD-XXX 번복 확인"이라고 명시적으로 말하면 진행
4. 아래 SUPERSEDED 섹션으로 이동, 새 LD 번호로 대체 결정 등록
```

---

## SUPERSEDED (번복된 결정)

### LD-010 (SUPERSEDED by LD-011) — users.role 이원화: guest vs buyer
- **번복 날짜**: 2026-04-25
- **원래 결정**: 결제 완료 → `role='buyer'`. `partner`는 수동 부여.
- **번복 사유**: 구매자는 즉시 파트너가 되어야 전환 마찰이 없음. 수동 승격 단계 제거.

### LD-002 (SUPERSEDED by LD-008) — (checkout) 라이트 강제 → 해제
- **번복 날짜**: 2026-04-24
- **원래 결정**: checkout 전체 data-theme="light" 강제
- **번복 사유**: 새 Liquid Glass 디자인 시스템(dark/light 완전 토큰 체계)이 다크에서도 WCAG AA 대비 충족.
  사용자가 명시적으로 선택한 테마를 결제 페이지에서 강제 변경하는 것은 UX 일관성 위반.
- **대체**: LD-008 — checkout은 사용자 선택 테마를 그대로 상속

### LD-008 — (checkout) 테마 상속 (LD-002 대체)
- **잠금 날짜**: 2026-04-24
- **결정 내용**: `(checkout)` 라우트 그룹은 전역 ThemeProvider 테마를 그대로 상속한다.
  `data-theme="light"` 강제 제거. LgThemeToggle 헤더에 추가.
- **이유**: Liquid Glass 다크 시스템이 WCAG AA를 충족하며, 사용자 테마 선택권 존중.
- **코드 위치**: `apps/web/src/app/(checkout)/layout.tsx`
