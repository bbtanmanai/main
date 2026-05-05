---
# V2 SESSION START — 이 파일 하나만 먼저 읽을 것
> 업데이트: 2026-05-06 | 전체 규칙: rules/LOCKED_DECISIONS.md | 전체 작업: rules/BACKLOG.md
---

## 🚨 지금 해야 할 일 (BACKLOG 요약)

| 항목 | 상태 | 비고 |
|------|------|------|
| TOSS | ⬜ | 토스페이먼츠 SDK 실제 키 연동 (payment/page.tsx placeholder 교체) |

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

## 📦 4/27 이후 완료된 작업 (BACKLOG 미반영분)

| 날짜 | 내용 |
|------|------|
| 2026-04-30 | 이미지 프롬프트 탭·about 페이지·성능 최적화 전반 구현 |
| 2026-05-05 | LdOnedaySection 공통 컴포넌트 추가 (원데이 클래스 랜딩 공통 섹션) |
| 2026-05-05 | AI 홈페이지 glassmorphism01 세트 추가 및 카드 정렬 |
| 2026-05-05 | project_list.json 누락 → Vercel 빌드 오류 수정 |
| 2026-05-05 | LdCinematicVideoBg — src(MP4) + playbackId(HLS) 둘 다 지원 |
| 2026-05-05 | middleware.ts → proxy.ts 통합 (Next.js 16 규칙) + /webnovel 보호 추가 |
| 2026-05-05 | homepage 구현 (`(public)/homepage/`) |
| 2026-05-05 | landing2/3/5/6 Guide 컴포넌트 연결 + GNB 웹소설 중메뉴 추가 |
| 2026-05-05 | landing 컴포넌트명 → landing 번호 기준 일괄 리네임 |
| 2026-05-05 | globals.css 2461줄 인라인 → 5개 @import 인덱스 전용으로 분리 |

---

## 🗂️ 현재 CSS 아키텍처

> globals.css는 이제 17줄 index — 직접 편집 금지

```
src/styles/
  base.css          기본 리셋·body·타이포
  tokens.css        CSS 커스텀 프로퍼티 (색상·폰트·간격)
  animations.css    @keyframes 전체
  layout.css        GNB·LgShell·공통 레이아웃
  components.css    공통 컴포넌트 (.ld-glass 등)
  pages/            페이지별 CSS (landing1~10, member, partner 등)
```

homepage.css는 `(public)/homepage/page.tsx`에서 직접 import.

---

## 🗂️ 현재 라우트 구조

```
(public)/
  page.tsx          index (/)
  homepage/         /homepage
  landing/[slug]/   /landing/landing1~10
  about/            /about
  ai-prompt/        /ai-prompt
  project/          /project
  webnovel/         /webnovel  ← /webnovel/* 미로그인 → /?auth=1 (middleware 보호)
  recruit-teacher/
  certificate-teacher/
  privacy/ terms/ refund/
(auth)/             /?auth=1 → LdAuthModal 진입점
(checkout)/         /checkout/*
(member)/           /member/*  ← 로그인 필요
(partner)/          /partner/*  ← role=partner/gold_partner 필요
(instructor)/       /instructor/*
admin/(panel)/      /admin/*
```

---

## ⚡ 코드 수정 전 체크

1. 변경이 LD 항목(테마/V3 import/색상/auth/role 등)에 해당하는가?
   → YES: `rules/LOCKED_DECISIONS.md` 확인 후 사용자에게 먼저 보여줄 것
   → NO: 바로 진행
2. GNB 수정 시: `rules/gnb.md` 반드시 확인
3. CSS 수정 시: `globals.css` 직접 편집 금지 → `src/styles/` 하위 해당 파일 편집

---

## 📁 추가 읽기가 필요한 경우만 (평상시 불필요)

| 상황 | 읽을 파일 |
|------|---------|
| 설계 전체 레퍼런스 | `archives/01_V2_프론트_설계_확정.md` |
| 404 라우트 문제 | `archives/02_라우트그룹_404_원인분석.md` |
| role/수당 구조 | `archives/03_V2_회원구분 및 역할.md` |
| 디버깅 체크리스트 | `rules/debugging.md` |
| Windows bat/cmd 작성 | `rules/windows.md` |
| GNB 전체 스펙 | `rules/gnb.md` |
