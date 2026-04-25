# LinkDrop V2 — 개발 백로그

> 최종 업데이트: 2026-04-24
> 규칙: 새 항목 발견 시 즉시 추가. 완료 시 아래 완료 요약에 날짜와 함께 한 줄로만 기록.

---

## ⬜ 미완료 항목 (4개)

| # | 항목 | 비고 |
|---|------|------|
| TOSS | 토스페이먼츠 SDK 실제 키 연동 | payment/page.tsx placeholder 교체 |
| AUTH-GUARD | middleware.ts 추가 — /member /partner /instructor /admin 미로그인 redirect | AUTH-SOCIAL Phase D |
| AUTH-SOCIAL-B | 소셜 로그인 UI — LdAuthModal, LdAuthBottomSheet, LdSocialButton(Kakao/Google), useAuthModal | Phase B 구현 대기 |
| AUTH-SOCIAL-C | OAuth 플로우 — /auth/callback/route.ts, useSession, users.role 승격 로직 | 사용자: Google/Kakao Developers 등록 후 진행 |

---

## ✅ 완료 요약

| Phase | 내용 | 완료일 |
|-------|------|--------|
| Phase 0 (P0-1~6) | Next.js 15 스캐폴드, next-themes, Pretendard, CSS 토큰, Tailwind v4, src/data JSON | 2026-04-22 |
| Phase 1 (P1-1~14, P1-16) | 마케팅 10 라우트 + 모든 섹션 컴포넌트 + expert-video 랜딩 | 2026-04-22~24 |
| Phase 2 (P2-1~3) | (auth) 로그인·회원가입 + Supabase Auth 연결 | 2026-04-22 |
| Phase 3 (P3-1~4) | (checkout) 주문·결제·완료 + LdStatusStepper | 2026-04-22 |
| Phase 4 (P4-1~3) | (member) 대시보드·콘텐츠·파트너 초대 | 2026-04-22 |
| Phase 5 (P5-1~2) | (partner) 수당 현황·파트너 네트워크 | 2026-04-22 |
| Phase 6 (P6-1~2) | (instructor) 강의 관리·수강생 | 2026-04-22 |
| Phase 7 (P7-1~3) | (admin) 회원·주문·파트너 관리 | 2026-04-22 |
| P1-15 + 모바일 GNB | prefers-reduced-motion globals.css + 햄버거 드로어 LdMobileDrawer + viewport export | 2026-04-24 |
| SUPABASE | .env.local — NEXT_PUBLIC_SUPABASE_URL + ANON_KEY 실제 값 연결 | 2026-04-24 |
