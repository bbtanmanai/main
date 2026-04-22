# LinkDrop V2 — 개발 백로그

> 최종 업데이트: 2026-04-22
> 규칙: 새 항목 발견 시 즉시 추가. 완료 시 ✅ 섹션으로 이동. 대화마다 이 파일 확인.

---

## 🚨 Phase 0: 프로젝트 스캐폴드

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| P0-1 | Next.js 15 App Router 초기화 (`apps/web/`) | ✅ | TypeScript, Tailwind CSS 포함 |
| P0-2 | `next-themes` 설치 + `defaultTheme="dark"` + `enableSystem=false` | ✅ | layout.tsx 완성 |
| P0-3 | Pretendard Variable CDN 연결 (WOFF2 서브셋 약 90KB) | ✅ | layout.tsx head 완성 |
| P0-4 | CSS 커스텀 프로퍼티 (`--bg-base`, `--text-primary` 등) 전체 등록 | ✅ | globals.css 완성 |
| P0-5 | Tailwind v4 `@theme` 토큰 매핑 | ✅ | color + fontFamily 완성 |
| P0-6 | `src/data/` 폴더 + 14개 JSON 파일 초기 생성 | ✅ | 2026-04-22 |

---

## 🔵 Phase 1: (public) 마케팅 10 라우트 + index 애니메이션

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| P1-1 | `app/page.tsx` — 홈 (히어로 + 9개 주제 카드 그리드) | ✅ | 4섹션 시네마틱 완성 (수정 금지) |
| P1-2 | `app/landing/[slug]/page.tsx` — 랜딩 SSG (9개 슬러그 generateStaticParams) | ✅ | 2026-04-22 |
| P1-3 | `LdHeroSection` — fade-up 600ms | ✅ | 2026-04-22 |
| P1-4 | `LdTopicCardGrid` + `LdTopicCard` — stagger fade-up 80ms | ⬜ | index 페이지 자체에 인라인 구현됨 |
| P1-5 | `LdV3PipelineSection` — 3단계 순차 fade-in + 화살표 draw | ✅ | 2026-04-22 |
| P1-6 | `LdSimulatorSection` — 슬라이더 2개 + 카운트업 800ms | ✅ | 2026-04-22 |
| P1-7 | `LdGrowthPathSection` (성장 경로 스테퍼 4단계) | ✅ | 2026-04-22 |
| P1-8 | `LdPricingSection` — 정가→런칭가 카운트업 | ✅ | 2026-04-22 |
| P1-9 | `LdFAQSection` + `LdAccordion` — 공통 5 + 주제별 2 | ✅ | 2026-04-22 |
| P1-10 | `LdNavHeader` + 테마 토글 (데스크톱) | ✅ | 2026-04-22 |
| P1-11 | `LdMobileNav` 풀스크린 오버레이 (모바일) | ✅ | 2026-04-22 |
| P1-12 | `LdFooter` — 사업자 법적 고지 포함 | ✅ | 2026-04-22 |
| P1-13 | `LdStickyBottomCTA` — 모바일 랜딩 하단 고정 바 | ✅ | 2026-04-22 |
| P1-14 | `/sitemap.xml` + `/robots.txt` + OG 태그 | ✅ | 2026-04-22 |
| P1-15 | `prefers-reduced-motion` 감지 — 전체 모션 즉시 정지 | ⬜ | globals.css에 기반 준비됨 |

---

## 🔵 Phase 2: (auth) 로그인·회원가입

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| P2-1 | `app/(auth)/login/page.tsx` | ✅ | 2026-04-22 |
| P2-2 | `app/(auth)/signup/page.tsx` | ✅ | 2026-04-22 |
| P2-3 | Supabase Auth 연결 | ✅ | @supabase/ssr 설치, .env.local 생성, createClient() 구현 |

---

## 🔵 Phase 3: (checkout) 결제 플로우

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| P3-1 | `app/(checkout)/order/page.tsx` — 주문 확인 | ✅ | 2026-04-22 |
| P3-2 | `app/(checkout)/payment/page.tsx` — 결제 (토스페이먼츠 placeholder) | ✅ | 2026-04-22 |
| P3-3 | `app/(checkout)/complete/page.tsx` — 완료 | ✅ | 2026-04-22 |
| P3-4 | `LdStatusStepper` 컴포넌트 | ✅ | 2026-04-22, LD-004 4색 고정 |

---

## 🔵 Phase 4: (member) 구매자 마이페이지

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| P4-1 | `app/(member)/dashboard/page.tsx` | ✅ | 2026-04-22 |
| P4-2 | `app/(member)/content/page.tsx` — 구매 콘텐츠 목록 | ✅ | 2026-04-22 |
| P4-3 | `app/(member)/referral/page.tsx` — 파트너 초대 | ✅ | 2026-04-22 |

---

## 🔵 Phase 5: (partner) 수당 대시보드

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| P5-1 | `app/(partner)/earnings/page.tsx` — 수당 현황 | ✅ | 2026-04-22, 3색 수익 LD-004 |
| P5-2 | `app/(partner)/network/page.tsx` — 파트너 네트워크 | ✅ | 2026-04-22 |

---

## 🔵 Phase 6: (instructor) 강사 관리

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| P6-1 | `app/(instructor)/courses/page.tsx` — 강의 관리 | ✅ | 2026-04-22 |
| P6-2 | `app/(instructor)/students/page.tsx` — 수강생 | ✅ | 2026-04-22 |

---

## 🔵 Phase 7: (admin) CRM

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| P7-1 | `app/(admin)/users/page.tsx` — 회원 목록 | ✅ | 2026-04-22 |
| P7-2 | `app/(admin)/orders/page.tsx` — 주문 목록 | ✅ | 2026-04-22 |
| P7-3 | `app/(admin)/partners/page.tsx` — 파트너 관리 | ✅ | 2026-04-22 |

---

## 🔵 남은 후속 작업

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| P1-15 | `prefers-reduced-motion` 감지 | ⬜ | globals.css에 미디어 쿼리 추가 |
| SUPABASE | 실제 Supabase 프로젝트 URL + ANON_KEY .env.local 연결 | ⬜ | 현재 placeholder |
| TOSS | 토스페이먼츠 SDK 실제 키 연동 | ⬜ | payment/page.tsx placeholder 교체 |
| AUTH-GUARD | middleware.ts 추가 — /member /partner /instructor /admin 미로그인 redirect | ⬜ | Supabase 연결 후 구현 |

---

## ✅ 완료

| # | 항목 | 완료일 |
|---|------|--------|
| P0-1~P0-6 | Phase 0 스캐폴드 전체 | 2026-04-22 |
| P1-1 | Index 페이지 4섹션 시네마틱 | 2026-04-22 |
| P1-2 | landing/[slug]/page.tsx SSG 9개 슬러그 | 2026-04-22 |
| P1-3 | LdHeroSection fade-up 600ms | 2026-04-22 |
| P1-5 | LdV3PipelineSection 순차 fade-in + 화살표 draw | 2026-04-22 |
| P1-6 | LdSimulatorSection 슬라이더 2개 + 카운트업 | 2026-04-22 |
| P1-7 | LdGrowthPathSection 4단계 스테퍼 | 2026-04-22 |
| P1-8 | LdPricingSection 정가→런칭가 카운트업 | 2026-04-22 |
| P1-9 | LdFAQSection + LdAccordion | 2026-04-22 |
| P1-10 | LdNavHeader + 테마 토글 | 2026-04-22 |
| P1-11 | LdMobileNav 풀스크린 오버레이 | 2026-04-22 |
| P1-12 | LdFooter 법적 고지 포함 | 2026-04-22 |
| P1-13 | LdStickyBottomCTA 모바일 하단 고정 바 | 2026-04-22 |
| P1-14 | sitemap.xml + robots.txt + OG 태그 | 2026-04-22 |
| P2-1 | (auth)/login/page.tsx | 2026-04-22 |
| P2-2 | (auth)/signup/page.tsx | 2026-04-22 |
| P2-3 | @supabase/ssr 설치 + createClient() | 2026-04-22 |
| P3-1 | (checkout)/order/page.tsx | 2026-04-22 |
| P3-2 | (checkout)/payment/page.tsx | 2026-04-22 |
| P3-3 | (checkout)/complete/page.tsx | 2026-04-22 |
| P3-4 | LdStatusStepper (LD-004 4색 고정) | 2026-04-22 |
| P4-1 | (member)/dashboard/page.tsx | 2026-04-22 |
| P4-2 | (member)/content/page.tsx | 2026-04-22 |
| P4-3 | (member)/referral/page.tsx | 2026-04-22 |
| P5-1 | (partner)/earnings/page.tsx | 2026-04-22 |
| P5-2 | (partner)/network/page.tsx | 2026-04-22 |
| P6-1 | (instructor)/courses/page.tsx | 2026-04-22 |
| P6-2 | (instructor)/students/page.tsx | 2026-04-22 |
| P7-1 | (admin)/users/page.tsx | 2026-04-22 |
| P7-2 | (admin)/orders/page.tsx | 2026-04-22 |
| P7-3 | (admin)/partners/page.tsx | 2026-04-22 |
